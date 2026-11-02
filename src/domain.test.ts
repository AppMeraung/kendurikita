import { describe, expect, it } from 'vitest';
import { budgetSummary, checklistProgress, guestSummary, money, validAmount } from './domain';

describe('KenduriKita domain calculations', () => {
  it('calculates budget totals and percentage', () => {
    expect(budgetSummary([
      { id: '1', name: 'A', category: 'A', planned: 1000, paid: 250 },
      { id: '2', name: 'B', category: 'B', planned: 500, paid: 500 },
    ], 2000)).toEqual({ planned: 1500, paid: 750, remaining: 1250, owed: 750, percent: 38, overBudget: false });
  });

  it('calculates checklist progress safely', () => {
    expect(checklistProgress([])).toBe(0);
    expect(checklistProgress([
      { id: '1', title: 'A', due: 'Hari ini', done: true, priority: 'Tinggi' },
      { id: '2', title: 'B', due: 'Esok', done: false, priority: 'Rendah' },
    ])).toBe(50);
  });

  it('summarises RSVP by pax rather than record count', () => {
    expect(guestSummary([
      { id: '1', name: 'A', group: 'Rakan', pax: 4, rsvp: 'Hadir' },
      { id: '2', name: 'B', group: 'VIP', pax: 2, rsvp: 'Menunggu' },
      { id: '3', name: 'C', group: 'Rakan', pax: 1, rsvp: 'Tidak hadir' },
    ])).toEqual({ total: 7, confirmed: 4, pending: 2, declined: 1 });
  });

  it('formats Malaysian ringgit and never shows a negative balance', () => {
    expect(money(12500)).toContain('12,500');
    expect(money(-10)).toContain('0');
  });

  it('rejects negative and non-number amounts', () => {
    expect(validAmount(0)).toBe(true);
    expect(validAmount('12.50')).toBe(true);
    expect(validAmount(-1)).toBe(false);
    expect(validAmount('nope')).toBe(false);
  });
});
