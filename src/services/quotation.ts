import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  QuotationLine,
  quotationHtml,
  quotationTotal,
} from "../domain/quotation";
import { supabase } from "./supabase";

export async function createQuotation(
  leadId: string,
  vendorId: string,
  vendorName: string,
  lines: QuotationLine[],
) {
  const number = `Q-${Date.now()}`;
  const { data, error } = await supabase
    .from("quotations")
    .insert({
      lead_id: leadId,
      vendor_id: vendorId,
      number,
      items: lines,
      total: quotationTotal(lines),
      status: "sent",
    })
    .select("id")
    .single();
  if (error) throw error;
  const update = await supabase
    .from("leads")
    .update({ status: "quotation_sent" })
    .eq("id", leadId);
  if (update.error) throw update.error;
  const { uri } = await Print.printToFileAsync({
    html: quotationHtml(number, vendorName, lines),
  });
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
  return data.id as string;
}

export async function respondToQuotation(
  id: string,
  response: "accepted" | "rejected",
) {
  const { error } = await supabase.rpc("respond_to_quotation", {
    target: id,
    response,
  });
  if (error) throw error;
}

export async function recordInvoicePayment(
  id: string,
  amount: number,
  method: string,
) {
  const { error } = await supabase.rpc("record_invoice_payment", {
    target: id,
    payment_amount: amount,
    payment_method: method,
  });
  if (error) throw error;
}
