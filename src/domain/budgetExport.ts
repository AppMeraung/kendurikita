import { BudgetItem, budgetSummary } from '../domain';

const csvCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const html = (value: string | number | undefined) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export function budgetCsv(items: BudgetItem[]) {
  const headers = ['Name', 'Category', 'Vendor', 'Planned', 'Paid', 'Balance', 'Payment type', 'Payment method', 'Payer', 'Paid date', 'Due date', 'Note'];
  return [headers.map(csvCell).join(','), ...items.map((item) => [item.name, item.category, item.vendor, item.planned, item.paid, Math.max(0, item.planned - item.paid), item.paymentType, item.paymentMethod, item.payer, item.paidAt, item.dueAt, item.note].map(csvCell).join(','))].join('\n');
}

export function budgetHtml(eventName: string, totalBudget: number, items: BudgetItem[], formatMoney: (value: number) => string) {
  const summary = budgetSummary(items, totalBudget);
  const rows = items.map((item) => `<tr><td>${html(item.name)}</td><td>${html(item.category)}</td><td>${html(item.vendor)}</td><td>${html(formatMoney(item.planned))}</td><td>${html(formatMoney(item.paid))}</td><td>${html(formatMoney(Math.max(0, item.planned - item.paid)))}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;padding:28px;color:#271A1E}h1{color:#9C123C}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #E9DADD;padding:8px;text-align:left}th{background:#FFF8EC}.totals{display:flex;gap:24px;flex-wrap:wrap}</style></head><body><h1>${html(eventName)}</h1><div class="totals"><b>Budget: ${html(formatMoney(totalBudget))}</b><b>Planned: ${html(formatMoney(summary.planned))}</b><b>Paid: ${html(formatMoney(summary.paid))}</b><b>Remaining: ${html(formatMoney(summary.remaining))}</b></div><table><thead><tr><th>Name</th><th>Category</th><th>Vendor</th><th>Planned</th><th>Paid</th><th>Balance</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}
