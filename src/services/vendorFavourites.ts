import { supabase } from "./supabase";

export async function loadVendorFavourites() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [] as string[];
  const { data, error } = await supabase.from("vendor_favourites").select("vendor_id").eq("user_id", user.id);
  if (error) throw error;
  return (data || []).map((row) => row.vendor_id);
}

export async function setVendorFavourite(vendorId: string, favourite: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("sign_in_required");
  const result = favourite
    ? await supabase.from("vendor_favourites").upsert({ user_id: user.id, vendor_id: vendorId })
    : await supabase.from("vendor_favourites").delete().eq("user_id", user.id).eq("vendor_id", vendorId);
  if (result.error) throw result.error;
}
