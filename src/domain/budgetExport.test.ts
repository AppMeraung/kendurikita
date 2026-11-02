import { describe, expect, it } from 'vitest';
import { budgetCsv, budgetHtml } from './budgetExport';

const item = { id: '1', name: 'Dewan, "A"', category: 'Dewan', vendor: '<Vendor>', planned: 1000, paid: 250, payer: 'shared' as const, note: 'Baris 1' };
describe('budget exports', () => {
  it('escapes commas and quotes in CSV', () => expect(budgetCsv([item])).toContain('"Dewan, ""A"""'));
  it('escapes untrusted text in PDF HTML', () => { const output = budgetHtml('A & B', 2000, [item], String); expect(output).toContain('A &amp; B'); expect(output).toContain('&lt;Vendor&gt;'); expect(output).not.toContain('<Vendor>'); });
  it('exports an empty budget with headers and zero totals', () => { expect(budgetCsv([]).split('\n')).toHaveLength(1); expect(budgetHtml('Empty', 0, [], String)).toContain('Remaining: 0'); });
});
