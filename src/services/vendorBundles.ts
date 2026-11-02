import { supabase } from "./supabase";

async function ownedVendor() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const { data, error } = await supabase
    .from("vendors")
    .select("id,company_name")
    .eq("owner_id", user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function loadBundleEditor() {
  const owner = await ownedVendor();
  const [bundles, vendors] = await Promise.all([
    supabase
      .from("vendor_bundles")
      .select(
        "id,name,description,price,active,commission_enabled,vendor_bundle_members(vendor_id,package_id,commission_percent,vendors(company_name))",
      )
      .eq("owner_vendor_id", owner.id)
      .order("name"),
    supabase
      .from("vendors")
      .select("id,company_name,vendor_packages(id,name)")
      .eq("verification_status", "approved")
      .order("company_name"),
  ]);
  if (bundles.error) throw bundles.error;
  if (vendors.error) throw vendors.error;
  return { owner, bundles: bundles.data || [], vendors: vendors.data || [] };
}

export async function createBundle(
  ownerVendorId: string,
  value: {
    name: string;
    description: string;
    price: number;
    commissionEnabled: boolean;
  },
  members: {
    vendorId: string;
    packageId?: string;
    commission: number;
  }[],
) {
  const bundle = await supabase
    .from("vendor_bundles")
    .insert({
      owner_vendor_id: ownerVendorId,
      name: value.name.trim(),
      description: value.description.trim() || null,
      price: value.price,
      commission_enabled: value.commissionEnabled,
      active: true,
    })
    .select("id")
    .single();
  if (bundle.error) throw bundle.error;
  const inserted = await supabase.from("vendor_bundle_members").insert(
    members.map((member) => ({
      bundle_id: bundle.data.id,
      vendor_id: member.vendorId,
      package_id: member.packageId || null,
      commission_percent: value.commissionEnabled ? member.commission : 0,
    })),
  );
  if (inserted.error) {
    await supabase.from("vendor_bundles").delete().eq("id", bundle.data.id);
    throw inserted.error;
  }
}

export async function deleteBundle(id: string) {
  const { error } = await supabase.from("vendor_bundles").delete().eq("id", id);
  if (error) throw error;
}

export async function loadPublicBundles() {
  const { data, error } = await supabase
    .from("vendor_bundles")
    .select(
      "id,name,description,price,vendor_bundle_members(vendor_id,vendors(company_name),vendor_packages(name))",
    )
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function requestBundle(
  bundleId: string,
  eventId: string,
  message: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const { error } = await supabase.from("vendor_bundle_requests").insert({
    bundle_id: bundleId,
    event_id: eventId,
    sender_id: user.id,
    message: message.trim(),
  });
  if (error) throw error;
}
