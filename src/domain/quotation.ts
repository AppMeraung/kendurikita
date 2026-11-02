export type QuotationLine = {
  description: string;
  quantity: number;
  unitPrice: number;
};
export function quotationTotal(lines: QuotationLine[]) {
  return lines.reduce(
    (sum, line) =>
      sum + Math.max(0, line.quantity) * Math.max(0, line.unitPrice),
    0,
  );
}
export function validQuotationLine(line: QuotationLine) {
  return (
    Boolean(line.description.trim()) &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    Number.isFinite(line.unitPrice) &&
    line.unitPrice >= 0
  );
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
export function quotationHtml(
  number: string,
  vendor: string,
  lines: QuotationLine[],
) {
  return `<!doctype html><html><body style="font-family:Arial;padding:32px"><h1>Quotation ${escape(number)}</h1><h2>${escape(vendor)}</h2><table style="width:100%;border-collapse:collapse"><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Total</th></tr>${lines.map((line) => `<tr><td>${escape(line.description)}</td><td>${line.quantity}</td><td>RM ${line.unitPrice.toFixed(2)}</td><td>RM ${(line.quantity * line.unitPrice).toFixed(2)}</td></tr>`).join("")}</table><h2>Total: RM ${quotationTotal(lines).toFixed(2)}</h2></body></html>`;
}
