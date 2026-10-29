import { describe, expect, it } from 'vitest';
import { budgetSummary, checklistProgress, guestSummary, money } from './domain';

describe('KenduriKita domain calculations', () => {
  it('calculates budget totals and percentage', () => {
    expect(budgetSummary([
      { id: '1', category: 'A', planned: 1000, spent: 250 },
      { id: '2', category: 'B', planned: 500, spent: 500 },
    ])).toEqual({ planned: 1500, spent: 750, remaining: 750, percent: 50 });
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
    expect(money(12500)).toBe('RM12,500');
    expect(money(-10)).toBe('RM0');
  });
});
