import { supabase } from "./supabase";

export type VendorJobSheet = {
  lead_id: string;
  event: {
    name: string;
    type: string;
    dates: string[];
    venue: { name?: string } | string;
    estimated_guests: number;
  };
  timeline: {
    title: string;
    starts_at?: string;
    ends_at?: string;
    pic_name?: string;
    note?: string;
  }[];
  contacts: { name: string; role: string; phone: string }[];
};

export async function loadVendorJobSheet(leadId: string) {
  const { data, error } = await supabase.rpc("get_vendor_job_sheet", {
    target_lead: leadId,
  });
  if (error) throw error;
  return data as VendorJobSheet;
}
