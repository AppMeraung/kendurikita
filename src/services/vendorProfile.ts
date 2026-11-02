import { VendorProfileDraft } from "../domain/vendorProfile";
import { supabase } from "./supabase";
import { PlaceLocation } from "./places";

export const vendorCategories = [
  "venue",
  "catering",
  "decor",
  "attire",
  "makeup",
  "photo_video",
  "invitation_gifts",
  "hantaran",
  "cake",
  "entertainment",
  "emcee",
  "equipment",
  "nikah",
  "henna",
  "planner",
  "transport",
  "florist",
  "cultural",
] as const;

export async function loadVendorProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const result = await supabase
    .from("vendors")
    .select("*,vendor_categories(category)")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

export async function saveVendorProfile(
  profile: VendorProfileDraft,
  categories: string[],
  location?: PlaceLocation,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const slugBase =
    profile.company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "vendor";
  const { data, error } = await supabase
    .from("vendors")
    .upsert(
      {
        owner_id: user.id,
        company_name: profile.company.trim(),
        slug: `${slugBase}-${user.id.slice(0, 8)}`,
        ssm_number: profile.ssm.trim(),
        business_type: profile.businessType.trim(),
        owner_name: profile.ownerName.trim(),
        phone: profile.phone.trim(),
        email: profile.email.trim(),
        address: location ? { line: profile.address.trim(), state: profile.state.trim(), place_id: location.placeId, latitude: location.latitude, longitude: location.longitude } : { line: profile.address.trim(), state: profile.state.trim() },
        coverage: profile.coverage
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        founded_year: profile.foundedYear ? Number(profile.foundedYear) : null,
        languages: profile.languages
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        short_description: {
          ms: profile.shortDescription.trim(),
          en: profile.shortDescriptionEn.trim(),
          zh: profile.shortDescriptionZh.trim(),
          ta: profile.shortDescriptionTa.trim(),
          id: profile.shortDescriptionId.trim(),
        },
        description: {
          ms: profile.description.trim(),
          en: profile.descriptionEn.trim(),
          zh: profile.descriptionZh.trim(),
          ta: profile.descriptionTa.trim(),
          id: profile.descriptionId.trim(),
        },
        social_links: {
          instagram: profile.instagram.trim(),
          tiktok: profile.tiktok.trim(),
          facebook: profile.facebook.trim(),
          website: profile.website.trim(),
        },
        policies: {
          deposit_percentage: Number(profile.deposit) || 0,
          payment_terms: profile.paymentTerms.trim(),
          cancellation: profile.cancellation.trim(),
          rescheduling: profile.rescheduling.trim(),
        },
      },
      { onConflict: "owner_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  const removed = await supabase
    .from("vendor_categories")
    .delete()
    .eq("vendor_id", data.id);
  if (removed.error) throw removed.error;
  if (categories.length) {
    const inserted = await supabase
      .from("vendor_categories")
      .insert(categories.map((category) => ({ vendor_id: data.id, category })));
    if (inserted.error) throw inserted.error;
  }
  return data.id as string;
}

export async function uploadVendorBrandImage(
  vendorId: string,
  kind: "logo" | "cover",
  file: { uri: string; name: string; mimeType?: string },
) {
  const source = await fetch(file.uri);
  if (!source.ok) throw new Error("brand_image_unreadable");
  const bytes = await source.arrayBuffer();
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("brand_image_too_large");
  const path = `${vendorId}/${kind}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
  const uploaded = await supabase.storage.from("vendor-media").upload(path, bytes, { contentType: file.mimeType || "image/jpeg", upsert: true });
  if (uploaded.error) throw uploaded.error;
  const url = supabase.storage.from("vendor-media").getPublicUrl(path).data.publicUrl;
  const updated = await supabase.from("vendors").update({ [kind === "logo" ? "logo_url" : "cover_url"]: url }).eq("id", vendorId);
  if (updated.error) throw updated.error;
  return url;
}

export async function uploadVerificationDocument(
  vendorId: string,
  kind: "ssm" | "ic",
  file: { uri: string; name: string; mimeType?: string },
) {
  const source = await fetch(file.uri);
  if (!source.ok) throw new Error("Dokumen tidak dapat dibaca.");
  const path = `${vendorId}/${kind}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
  const upload = await supabase.storage
    .from("vendor-verification")
    .upload(path, await source.arrayBuffer(), {
      contentType: file.mimeType || "application/octet-stream",
      upsert: true,
    });
  if (upload.error) throw upload.error;
  const current = await supabase
    .from("vendors")
    .select("verification_documents")
    .eq("id", vendorId)
    .single();
  if (current.error) throw current.error;
  const update = await supabase
    .from("vendors")
    .update({
      verification_documents: {
        ...(current.data.verification_documents || {}),
        [kind]: path,
      },
      verification_status: "pending",
    })
    .eq("id", vendorId);
  if (update.error) throw update.error;
  return path;
}
