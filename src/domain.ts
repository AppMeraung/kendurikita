export type BudgetItem = { id: string; category: string; planned: number; spent: number };
export type ChecklistItem = { id: string; title: string; due: string; done: boolean; priority: 'Tinggi' | 'Sederhana' | 'Rendah' };
export type Guest = { id: string; name: string; group: string; pax: number; rsvp: 'Hadir' | 'Menunggu' | 'Tidak hadir' };

export const money = (value: number) => `RM${Math.max(0, value).toLocaleString('en-MY')}`;

export function budgetSummary(items: BudgetItem[]) {
  const planned = items.reduce((sum, item) => sum + item.planned, 0);
  const spent = items.reduce((sum, item) => sum + item.spent, 0);
  return { planned, spent, remaining: planned - spent, percent: planned ? Math.round((spent / planned) * 100) : 0 };
}

export function checklistProgress(items: ChecklistItem[]) {
  if (!items.length) return 0;
  return Math.round((items.filter((item) => item.done).length / items.length) * 100);
}

export function guestSummary(guests: Guest[]) {
  return guests.reduce(
    (summary, guest) => {
      summary.total += guest.pax;
      if (guest.rsvp === 'Hadir') summary.confirmed += guest.pax;
      if (guest.rsvp === 'Menunggu') summary.pending += guest.pax;
      if (guest.rsvp === 'Tidak hadir') summary.declined += guest.pax;
      return summary;
    },
    { total: 0, confirmed: 0, pending: 0, declined: 0 },
  );
}
