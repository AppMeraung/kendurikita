import { admin, json } from '../_shared/client.ts';
import { bearerMatches } from '../_shared/auth.ts';
import { failedToken, isWithinQuietHours, renderPush, type PushTemplate } from '../_shared/push.ts';

const SEND_URL = 'https://exp.host/--/api/v2/push/send';
const RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const categories = ['reminders', 'rsvp', 'messages', 'payments', 'vendor_leads', 'promotions'] as const;

type Category = (typeof categories)[number];
type Token = { user_id: string; token: string; language: string };
type Setting = { user_id: string; categories: Record<string, boolean>; quiet_start: string; quiet_end: string; timezone: string; promotions: boolean };
type Ticket = { id?: string; status?: string; message?: string; details?: { error?: string } };
type Payload = { userIds: string[]; category: Category; template?: PushTemplate; variables?: Record<string, string | number>; title?: string; body?: string; deepLink: string; urgent?: boolean };

function hourInTimezone(timezone: string) {
  const part = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: timezone }).formatToParts(new Date()).find((item) => item.type === 'hour');
  return Number(part?.value || 0);
}
const parseHour = (time: string | undefined, fallback: number) => Number(time?.split(':')[0] ?? fallback);
async function fetchWithRetry(url: string, init: RequestInit, attempts = 3) {
  let response: Response | undefined;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      response = await fetch(url, init);
      if (response.ok || response.status < 500) return response;
    } catch {
      if (attempt === attempts - 1) throw new Error('expo_network_error');
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
  }
  return response!;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!bearerMatches(request.headers.get('authorization'), Deno.env.get('PUSH_FUNCTION_SECRET'))) return json({ error: 'unauthorized' }, 401);

  const payload = await request.json() as Payload;
  if (!Array.isArray(payload.userIds) || !payload.userIds.length || payload.userIds.length > 1000 || !categories.includes(payload.category) || (!payload.template && (!payload.title || !payload.body))) return json({ error: 'invalid_payload' }, 400);
  const db = admin();
  const [{ data: settings }, { data: tokens }, { data: recentLogs }] = await Promise.all([
    db.from('notification_settings').select('*').in('user_id', payload.userIds),
    db.from('push_tokens').select('user_id,token,language').in('user_id', payload.userIds),
    db.from('notification_log').select('user_id,category,sent_at').in('user_id', payload.userIds).gte('sent_at', new Date(Date.now() - 7 * 86400000).toISOString()).eq('status', 'sent'),
  ]);
  const settingsByUser = new Map((settings as Setting[] | null || []).map((setting) => [setting.user_id, setting]));
  const logs = recentLogs || [];
  const allowed = (token: Token) => {
    const setting = settingsByUser.get(token.user_id);
    if (setting?.categories?.[payload.category] === false) return false;
    if (payload.category === 'promotions' && !setting?.promotions) return false;
    const userLogs = logs.filter((log) => log.user_id === token.user_id);
    if (userLogs.filter((log) => Date.now() - Date.parse(log.sent_at) < 86400000).length >= 5) return false;
    if (payload.category === 'promotions' && userLogs.some((log) => log.category === 'promotions')) return false;
    if (payload.urgent) return true;
    const timezone = setting?.timezone || 'Asia/Kuala_Lumpur';
    return !isWithinQuietHours(hourInTimezone(timezone), parseHour(setting?.quiet_start, 22), parseHour(setting?.quiet_end, 8));
  };
  const recipients = (tokens as Token[] | null || []).filter(allowed);
  const messages = recipients.map((token) => {
    const rendered = payload.template ? renderPush(payload.template, token.language, payload.variables) : { title: payload.title!, body: payload.body! };
    return { to: token.token, sound: 'default', title: rendered.title, body: rendered.body, channelId: payload.category, data: { url: payload.deepLink } };
  });
  const logsToInsert: { user_id: string; token: string; category: string; status: string; error?: string }[] = [];
  const invalidTokens = new Set<string>();
  const receiptIds: { id: string; token: string; userId: string }[] = [];

  for (let offset = 0; offset < messages.length; offset += 100) {
    const batch = messages.slice(offset, offset + 100);
    const response = await fetchWithRetry(SEND_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(batch) });
    if (!response.ok) {
      batch.forEach((message, index) => logsToInsert.push({ user_id: recipients[offset + index].user_id, token: message.to, category: payload.category, status: 'failed', error: `expo_http_${response.status}` }));
      continue;
    }
    const result = await response.json() as { data?: Ticket[] };
    batch.forEach((message, index) => {
      const ticket = result.data?.[index] || { status: 'error', message: 'missing_ticket' };
      const recipient = recipients[offset + index];
      if (failedToken(ticket)) invalidTokens.add(message.to);
      if (ticket.status === 'ok' && ticket.id) receiptIds.push({ id: ticket.id, token: message.to, userId: recipient.user_id });
      logsToInsert.push({ user_id: recipient.user_id, token: message.to, category: payload.category, status: ticket.status === 'ok' ? 'sent' : 'failed', error: ticket.message || ticket.details?.error });
    });
  }

  for (let offset = 0; offset < receiptIds.length; offset += 1000) {
    const batch = receiptIds.slice(offset, offset + 1000);
    const response = await fetchWithRetry(RECEIPTS_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: batch.map((item) => item.id) }) });
    if (!response.ok) continue;
    const result = await response.json() as { data?: Record<string, Ticket> };
    batch.forEach((item) => { if (result.data?.[item.id] && failedToken(result.data[item.id])) invalidTokens.add(item.token); });
  }
  if (invalidTokens.size) await db.from('push_tokens').delete().in('token', [...invalidTokens]);
  if (logsToInsert.length) await db.from('notification_log').insert(logsToInsert);

  const inbox = [...new Set(recipients.map((token) => token.user_id))].map((userId) => {
    const token = recipients.find((item) => item.user_id === userId)!;
    const rendered = payload.template ? renderPush(payload.template, token.language, payload.variables) : { title: payload.title!, body: payload.body! };
    return { user_id: userId, category: payload.category, title: rendered.title, body: rendered.body, deep_link: payload.deepLink };
  });
  if (inbox.length) await db.from('notifications').insert(inbox);
  return json({ sent: logsToInsert.filter((entry) => entry.status === 'sent').length, failed: logsToInsert.filter((entry) => entry.status === 'failed').length, removedTokens: invalidTokens.size, suppressed: (tokens?.length || 0) - recipients.length });
});
