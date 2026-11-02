export const pushLanguages = ['ms', 'en', 'zh', 'ta', 'id'] as const;
export type PushLanguage = (typeof pushLanguages)[number];
export type PushTemplate = 'task_due' | 'new_rsvp' | 'payment_due' | 'vendor_lead' | 'package_active' | 'billing_issue' | 'vendor_weekly_summary' | 'new_message' | 'quotation_response' | 'new_review' | 'verification' | 'countdown' | 'rsvp_pending' | 'lead_unanswered' | 'event_followup' | 'task_assigned' | 'over_budget' | 'booking_confirmed' | 'member_joined' | 'payment_recorded' | 'event_day' | 'admin_alert';

type Copy = Record<PushTemplate, { title: string; body: string }>;
const copy: Record<PushLanguage, Copy> = {
  ms: {
    task_due: { title: 'Tugasan hampir tamat', body: 'Tugasan “{{task}}” tamat {{when}}' },
    new_rsvp: { title: 'RSVP baharu', body: '{{count}} tetamu baru sahkan hadir (jumlah {{total}} pax)' },
    payment_due: { title: 'Bayaran akan tiba', body: 'Baki {{amount}} kepada {{vendor}} perlu dibayar {{date}}' },
    vendor_lead: { title: 'Pertanyaan baharu', body: '{{event}}, {{location}}, {{pax}} pax' },
    package_active: { title: 'Pakej aktif', body: 'Pakej {{package}} aktif. Terima kasih!' },
    new_message: { title: 'Mesej baharu', body: '{{sender}}: {{message}}' }, quotation_response: { title: 'Sebut harga dikemas kini', body: 'Sebut harga {{number}} {{status}}' }, new_review: { title: 'Ulasan baharu', body: 'Anda menerima ulasan {{rating}} bintang' }, verification: { title: 'Status vendor', body: 'Akaun vendor anda {{status}}' }, countdown: { title: 'Kiraan detik majlis', body: 'Lagi {{days}} hari ke {{event}}! 🎉' }, rsvp_pending: { title: 'RSVP belum dijawab', body: '{{count}} tetamu belum menjawab RSVP' }, lead_unanswered: { title: 'Pertanyaan belum dijawab', body: 'Anda mempunyai {{count}} pertanyaan belum dijawab' }, event_followup: { title: 'Selepas majlis', body: 'Kongsi gambar dan ucapan terima kasih untuk {{event}}' },
    task_assigned:{title:'Tugasan baharu',body:'{{assigner}} tugaskan anda: {{task}}'},over_budget:{title:'Amaran bajet',body:'Perbelanjaan {{event}} mencapai {{percent}}% bajet'},booking_confirmed:{title:'Tempahan disahkan',body:'Tempahan dengan {{vendor}} telah disahkan'},member_joined:{title:'Ahli menyertai majlis',body:'{{member}} telah menyertai {{event}}'},payment_recorded:{title:'Bayaran diterima',body:'{{kind}} {{amount}} diterima untuk {{event}}'},event_day:{title:'Hari majlis tiba!',body:'{{event}} · {{attendance}} tetamu check-in · Seterusnya: {{next}}'},admin_alert:{title:'Tindakan admin diperlukan',body:'{{message}}'},billing_issue:{title:'Tindakan pembayaran diperlukan',body:'Pembaharuan {{package}} menghadapi masalah. Kemas kini kaedah bayaran anda.'},vendor_weekly_summary:{title:'Ringkasan vendor mingguan',body:'{{views}} paparan · {{leads}} pertanyaan · {{bookings}} tempahan minggu ini'},
  },
  en: {
    task_due: { title: 'Task due soon', body: '“{{task}}” is due {{when}}' },
    new_rsvp: { title: 'New RSVPs', body: '{{count}} guests just confirmed ({{total}} pax total)' },
    payment_due: { title: 'Payment due soon', body: '{{amount}} balance to {{vendor}} is due {{date}}' },
    vendor_lead: { title: 'New enquiry', body: '{{event}}, {{location}}, {{pax}} pax' },
    package_active: { title: 'Package active', body: 'Your {{package}} package is active. Thank you!' },
    new_message: { title: 'New message', body: '{{sender}}: {{message}}' }, quotation_response: { title: 'Quotation updated', body: 'Quotation {{number}} was {{status}}' }, new_review: { title: 'New review', body: 'You received a {{rating}}-star review' }, verification: { title: 'Vendor status', body: 'Your vendor account is {{status}}' }, countdown: { title: 'Event countdown', body: '{{days}} days until {{event}}! 🎉' }, rsvp_pending: { title: 'Pending RSVPs', body: '{{count}} guests have not replied' }, lead_unanswered: { title: 'Unanswered enquiries', body: 'You have {{count}} unanswered enquiries' }, event_followup: { title: 'After your event', body: 'Share photos and thank-you messages for {{event}}' },
    task_assigned:{title:'New task',body:'{{assigner}} assigned you: {{task}}'},over_budget:{title:'Budget alert',body:'{{event}} spending reached {{percent}}% of budget'},booking_confirmed:{title:'Booking confirmed',body:'Your booking with {{vendor}} is confirmed'},member_joined:{title:'Member joined',body:'{{member}} joined {{event}}'},payment_recorded:{title:'Payment received',body:'{{kind}} {{amount}} received for {{event}}'},event_day:{title:'Your event day is here!',body:'{{event}} · {{attendance}} checked in · Next: {{next}}'},admin_alert:{title:'Admin action required',body:'{{message}}'},billing_issue:{title:'Payment action required',body:'Your {{package}} renewal has an issue. Update your payment method.'},vendor_weekly_summary:{title:'Weekly vendor summary',body:'{{views}} views · {{leads}} enquiries · {{bookings}} bookings this week'},
  },
  zh: {
    task_due: { title: '任务即将到期', body: '任务“{{task}}”将在{{when}}到期' },
    new_rsvp: { title: '新的 RSVP', body: '{{count}} 位宾客刚确认出席（共 {{total}} 人）' },
    payment_due: { title: '付款即将到期', body: '应付给 {{vendor}} 的余款 {{amount}} 将于 {{date}} 到期' },
    vendor_lead: { title: '新的咨询', body: '{{event}}，{{location}}，{{pax}} 人' },
    package_active: { title: '配套已启用', body: '{{package}} 配套已启用。谢谢！' },
    new_message: { title: '新消息', body: '{{sender}}：{{message}}' }, quotation_response: { title: '报价已更新', body: '报价 {{number}} 已{{status}}' }, new_review: { title: '新评价', body: '您收到 {{rating}} 星评价' }, verification: { title: '商家状态', body: '您的商家账户{{status}}' }, countdown: { title: '活动倒计时', body: '距离 {{event}} 还有 {{days}} 天！🎉' }, rsvp_pending: { title: '待回复 RSVP', body: '仍有 {{count}} 位宾客未回复' }, lead_unanswered: { title: '未回复咨询', body: '您有 {{count}} 条未回复咨询' }, event_followup: { title: '活动结束后', body: '为 {{event}} 分享照片和感谢信息' },
    task_assigned:{title:'新任务',body:'{{assigner}} 指派给您：{{task}}'},over_budget:{title:'预算提醒',body:'{{event}} 支出已达到预算的 {{percent}}%'},booking_confirmed:{title:'预订已确认',body:'您与 {{vendor}} 的预订已确认'},member_joined:{title:'成员已加入',body:'{{member}} 已加入 {{event}}'},payment_recorded:{title:'已收到付款',body:'{{event}} 已收到 {{kind}} {{amount}}'},event_day:{title:'活动日到了！',body:'{{event}} · 已签到 {{attendance}} 人 · 接下来：{{next}}'},admin_alert:{title:'需要管理员处理',body:'{{message}}'},billing_issue:{title:'需要处理付款',body:'{{package}} 续订出现问题，请更新付款方式。'},vendor_weekly_summary:{title:'每周商家摘要',body:'本周 {{views}} 次浏览 · {{leads}} 条咨询 · {{bookings}} 个预订'},
  },
  ta: {
    task_due: { title: 'பணி விரைவில் முடிவடைகிறது', body: '“{{task}}” பணி {{when}} முடிவடைகிறது' },
    new_rsvp: { title: 'புதிய RSVP', body: '{{count}} விருந்தினர்கள் வருகையை உறுதிசெய்தனர் (மொத்தம் {{total}} பேர்)' },
    payment_due: { title: 'கட்டணம் விரைவில் செலுத்த வேண்டும்', body: '{{vendor}}-க்கு {{amount}} மீதியை {{date}} செலுத்த வேண்டும்' },
    vendor_lead: { title: 'புதிய விசாரணை', body: '{{event}}, {{location}}, {{pax}} பேர்' },
    package_active: { title: 'தொகுப்பு செயல்பாட்டில் உள்ளது', body: '{{package}} தொகுப்பு செயல்பாட்டில் உள்ளது. நன்றி!' },
    new_message: { title: 'புதிய செய்தி', body: '{{sender}}: {{message}}' }, quotation_response: { title: 'விலைப்புள்ளி புதுப்பிக்கப்பட்டது', body: '{{number}} விலைப்புள்ளி {{status}}' }, new_review: { title: 'புதிய மதிப்புரை', body: '{{rating}} நட்சத்திர மதிப்புரை கிடைத்தது' }, verification: { title: 'விற்பனையாளர் நிலை', body: 'உங்கள் விற்பனையாளர் கணக்கு {{status}}' }, countdown: { title: 'நிகழ்வு கவுண்ட்டவுன்', body: '{{event}} நிகழ்வுக்கு இன்னும் {{days}} நாட்கள்! 🎉' }, rsvp_pending: { title: 'நிலுவை RSVP', body: '{{count}} விருந்தினர்கள் இன்னும் பதிலளிக்கவில்லை' }, lead_unanswered: { title: 'பதிலளிக்காத விசாரணைகள்', body: '{{count}} விசாரணைகளுக்கு பதில் இல்லை' }, event_followup: { title: 'நிகழ்வுக்குப் பின்', body: '{{event}}க்கான படங்களையும் நன்றிச் செய்திகளையும் பகிருங்கள்' },
    task_assigned:{title:'புதிய பணி',body:'{{assigner}} உங்களுக்கு ஒதுக்கியது: {{task}}'},over_budget:{title:'பட்ஜெட் எச்சரிக்கை',body:'{{event}} செலவு பட்ஜெட்டில் {{percent}}% எட்டியது'},booking_confirmed:{title:'முன்பதிவு உறுதி',body:'{{vendor}} உடனான முன்பதிவு உறுதியானது'},member_joined:{title:'உறுப்பினர் சேர்ந்தார்',body:'{{member}} {{event}} நிகழ்வில் சேர்ந்தார்'},payment_recorded:{title:'பணம் பெறப்பட்டது',body:'{{event}}க்கு {{kind}} {{amount}} பெறப்பட்டது'},event_day:{title:'நிகழ்வு நாள் வந்தது!',body:'{{event}} · {{attendance}} செக்-இன் · அடுத்து: {{next}}'},admin_alert:{title:'நிர்வாக நடவடிக்கை தேவை',body:'{{message}}'},billing_issue:{title:'கட்டண நடவடிக்கை தேவை',body:'{{package}} புதுப்பிப்பில் சிக்கல். கட்டண முறையைப் புதுப்பிக்கவும்.'},vendor_weekly_summary:{title:'வாராந்திர விற்பனையாளர் சுருக்கம்',body:'இந்த வாரம் {{views}} பார்வைகள் · {{leads}} விசாரணைகள் · {{bookings}} முன்பதிவுகள்'},
  },
  id: {
    task_due: { title: 'Tugas segera jatuh tempo', body: 'Tugas “{{task}}” jatuh tempo {{when}}' },
    new_rsvp: { title: 'RSVP baru', body: '{{count}} tamu baru mengonfirmasi hadir (total {{total}} orang)' },
    payment_due: { title: 'Pembayaran segera jatuh tempo', body: 'Sisa {{amount}} kepada {{vendor}} harus dibayar {{date}}' },
    vendor_lead: { title: 'Pertanyaan baru', body: '{{event}}, {{location}}, {{pax}} orang' },
    package_active: { title: 'Paket aktif', body: 'Paket {{package}} aktif. Terima kasih!' },
    new_message: { title: 'Pesan baru', body: '{{sender}}: {{message}}' }, quotation_response: { title: 'Penawaran diperbarui', body: 'Penawaran {{number}} {{status}}' }, new_review: { title: 'Ulasan baru', body: 'Anda menerima ulasan {{rating}} bintang' }, verification: { title: 'Status vendor', body: 'Akun vendor Anda {{status}}' }, countdown: { title: 'Hitung mundur acara', body: '{{days}} hari lagi menuju {{event}}! 🎉' }, rsvp_pending: { title: 'RSVP tertunda', body: '{{count}} tamu belum menjawab' }, lead_unanswered: { title: 'Pertanyaan belum dijawab', body: 'Anda memiliki {{count}} pertanyaan belum dijawab' }, event_followup: { title: 'Setelah acara', body: 'Bagikan foto dan ucapan terima kasih untuk {{event}}' },
    task_assigned:{title:'Tugas baru',body:'{{assigner}} menugaskan Anda: {{task}}'},over_budget:{title:'Peringatan anggaran',body:'Pengeluaran {{event}} mencapai {{percent}}% anggaran'},booking_confirmed:{title:'Pemesanan dikonfirmasi',body:'Pemesanan dengan {{vendor}} telah dikonfirmasi'},member_joined:{title:'Anggota bergabung',body:'{{member}} bergabung dengan {{event}}'},payment_recorded:{title:'Pembayaran diterima',body:'{{kind}} {{amount}} diterima untuk {{event}}'},event_day:{title:'Hari acara tiba!',body:'{{event}} · {{attendance}} check-in · Berikutnya: {{next}}'},admin_alert:{title:'Tindakan admin diperlukan',body:'{{message}}'},billing_issue:{title:'Tindakan pembayaran diperlukan',body:'Pembaruan {{package}} bermasalah. Perbarui metode pembayaran Anda.'},vendor_weekly_summary:{title:'Ringkasan vendor mingguan',body:'{{views}} tampilan · {{leads}} pertanyaan · {{bookings}} pemesanan minggu ini'},
  },
};

export function normalisePushLanguage(language?: string): PushLanguage {
  const candidate = language?.split('-')[0] as PushLanguage;
  return pushLanguages.includes(candidate) ? candidate : 'ms';
}

export function renderPush(template: PushTemplate, language: string | undefined, variables: Record<string, string | number> = {}) {
  const selected = copy[normalisePushLanguage(language)][template];
  const interpolate = (value: string) => value.replace(/{{(\w+)}}/g, (_, key: string) => String(variables[key] ?? ''));
  return { title: interpolate(selected.title), body: interpolate(selected.body) };
}

export function isWithinQuietHours(hour: number, start = 22, end = 8) {
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

export function failedToken(ticketOrReceipt: { status?: string; details?: { error?: string } }) {
  return ticketOrReceipt.status === 'error' && ticketOrReceipt.details?.error === 'DeviceNotRegistered';
}
