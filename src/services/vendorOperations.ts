import { supabase } from "./supabase";
async function ownedVendor() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const result = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (result.error) throw result.error;
  return result.data.id as string;
}
export async function loadVendorPackages() {
  const vendorId = await ownedVendor();
  const result = await supabase
    .from("vendor_packages")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("name");
  if (result.error) throw result.error;
  return { vendorId, items: result.data || [] };
}
export async function saveVendorPackage(
  vendorId: string,
  id: string | undefined,
  value: Record<string, unknown>,
) {
  const query = id
    ? supabase
        .from("vendor_packages")
        .update(value)
        .eq("id", id)
        .eq("vendor_id", vendorId)
    : supabase
        .from("vendor_packages")
        .insert({ ...value, vendor_id: vendorId });
  const { error } = await query;
  if (error) throw error;
}
export async function deleteVendorPackage(id: string) {
  const { error } = await supabase
    .from("vendor_packages")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
export async function loadVendorAvailability() {
  const vendorId = await ownedVendor();
  const result = await supabase
    .from("vendor_availability")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("starts_at");
  if (result.error) throw result.error;
  return { vendorId, items: result.data || [] };
}
export async function saveVendorAvailability(
  vendorId: string,
  id: string | undefined,
  value: Record<string, unknown>,
) {
  const query = id
    ? supabase
        .from("vendor_availability")
        .update(value)
        .eq("id", id)
        .eq("vendor_id", vendorId)
    : supabase
        .from("vendor_availability")
        .insert({ ...value, vendor_id: vendorId });
  const { error } = await query;
  if (error) throw error;
}
export async function deleteVendorAvailability(id: string) {
  const { error } = await supabase
    .from("vendor_availability")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
