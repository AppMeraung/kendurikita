export function isQuietHour(nowHour: number, start = 22, end = 8) { return start > end ? nowHour >= start || nowHour < end : nowHour >= start && nowHour < end; }
export function groupRsvp(counts: number[]) { return counts.reduce((total, count) => total + Math.max(0, count), 0); }
export function canSendPromotion(optedIn: boolean, sentLastSevenDays: number) { return optedIn && sentLastSevenDays < 1; }
