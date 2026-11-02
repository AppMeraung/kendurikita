import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BudgetItem, money } from '../domain';
import { budgetCsv, budgetHtml } from '../domain/budgetExport';

async function share(uri: string, mimeType: string, dialogTitle: string) {
  if (!await Sharing.isAvailableAsync()) throw new Error('Perkongsian fail tidak tersedia pada peranti ini.');
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}
export async function shareBudgetCsv(eventName: string, items: BudgetItem[]) {
  const safeName = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
  const file = new File(Paths.cache, `kendurikita-budget-${safeName}-${Date.now()}.csv`);
  file.create();
  await file.write(budgetCsv(items));
  await share(file.uri, 'text/csv', 'Kongsi bajet CSV');
}
export async function shareBudgetPdf(eventName: string, totalBudget: number, country: 'MY' | 'ID', items: BudgetItem[]) {
  const result = await Print.printToFileAsync({ html: budgetHtml(eventName, totalBudget, items, (value) => money(value, country)) });
  await share(result.uri, 'application/pdf', 'Kongsi laporan bajet');
}
