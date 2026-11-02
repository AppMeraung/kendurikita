import { admin, json } from "../_shared/client.ts";

type Job = { id: string; user_id: string; category: string; template: string; variables: Record<string, string | number>; deep_link: string; urgent: boolean };

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const secret = Deno.env.get("PUSH_FUNCTION_SECRET");
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json({ error: "unauthorized" }, 401);
  const db = admin();
  const generated = await db.rpc("enqueue_scheduled_notifications", { run_at: new Date().toISOString() });
  if (generated.error) return json({ error: generated.error.message }, 500);
  const vendorGenerated = await db.rpc("enqueue_vendor_weekly_notifications", { run_at: new Date().toISOString() });
  if (vendorGenerated.error) return json({ error: vendorGenerated.error.message }, 500);
  const claimed = await db.rpc("claim_notification_jobs", { batch_size: 100 });
  if (claimed.error) return json({ error: claimed.error.message }, 500);
  const baseUrl = Deno.env.get("SUPABASE_URL");
  if (!baseUrl) return json({ error: "missing_supabase_url" }, 500);
  let sent = 0; let failed = 0;
  for (const job of (claimed.data || []) as Job[]) {
    try {
      const response = await fetch(`${baseUrl}/functions/v1/send-push`, { method: "POST", headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" }, body: JSON.stringify({ userIds: [job.user_id], category: job.category, template: job.template, variables: job.variables, deepLink: job.deep_link, urgent: job.urgent }) });
      const body = await response.text();
      if (!response.ok) throw new Error(body.slice(0, 500));
      await db.from("notification_jobs").update({ status: "sent", processed_at: new Date().toISOString(), last_error: null }).eq("id", job.id);
      sent++;
    } catch (error) {
      await db.from("notification_jobs").update({ status: "failed", last_error: error instanceof Error ? error.message : "unknown_error" }).eq("id", job.id);
      failed++;
    }
  }
  return json({ generated: (generated.data || 0) + (vendorGenerated.data || 0), claimed: claimed.data?.length || 0, sent, failed });
});
