import * as Crypto from "expo-crypto";
import { supabase } from "./supabase";
import { compressUploadImage } from "./images";

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

export async function loadPortfolio() {
  const vendorId = await ownedVendor();
  const [portfolio, reviews] = await Promise.all([
    supabase
      .from("vendor_portfolio")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("sort_order"),
    supabase
      .from("vendor_reviews")
      .select("id,rating,body,reply,verified,photo_paths,created_at")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
  ]);
  if (portfolio.error) throw portfolio.error;
  if (reviews.error) throw reviews.error;
  return {
    vendorId,
    items: portfolio.data || [],
    reviews: reviews.data || [],
  };
}

export async function uploadPortfolioImage(
  vendorId: string,
  file: { uri: string; name: string; mimeType?: string },
  caption: string,
  eventName: string,
) {
  const compressed = await compressUploadImage(file.uri);
  const source = await fetch(compressed.uri);
  if (!source.ok) throw new Error("Imej tidak dapat dibaca.");
  const safeBase = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  const path = `${vendorId}/${Date.now()}-${safeBase}.jpg`;
  const upload = await supabase.storage
    .from("vendor-media")
    .upload(path, await source.arrayBuffer(), {
      contentType: "image/jpeg",
    });
  if (upload.error) throw upload.error;
  const url = supabase.storage.from("vendor-media").getPublicUrl(path)
    .data.publicUrl;
  const result = await supabase.from("vendor_portfolio").insert({
    vendor_id: vendorId,
    media_url: url,
    media_type: "image",
    caption: caption.trim() || null,
    event_name: eventName.trim() || null,
    storage_path: path,
    sort_order: Date.now(),
  });
  if (result.error) {
    await supabase.storage.from("vendor-media").remove([path]);
    throw result.error;
  }
}

export async function addPortfolioVideo(
  vendorId: string,
  url: string,
  caption: string,
  eventName: string,
) {
  const { error } = await supabase.from("vendor_portfolio").insert({
    vendor_id: vendorId,
    media_url: url.trim(),
    media_type: "video",
    caption: caption.trim() || null,
    event_name: eventName.trim() || null,
    sort_order: Date.now(),
  });
  if (error) throw error;
}

export async function deletePortfolioItem(id: string) {
  const existing = await supabase.from("vendor_portfolio").select("storage_path").eq("id", id).maybeSingle();
  if (existing.error) throw existing.error;
  const { error } = await supabase
    .from("vendor_portfolio")
    .delete()
    .eq("id", id);
  if (error) throw error;
  if (existing.data?.storage_path) {
    const removed = await supabase.storage.from("vendor-media").remove([existing.data.storage_path]);
    if (removed.error) throw removed.error;
  }
}

export async function createVendorReview(
  vendorId: string,
  eventId: string,
  rating: number,
  body: string,
  photos: { uri: string; name: string; mimeType?: string }[] = [],
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const photoPaths: string[] = [];
  try {
    for (const photo of photos.slice(0, 3)) {
      const compressed = await compressUploadImage(photo.uri);
      const source = await fetch(compressed.uri);
      if (!source.ok) throw new Error("review_photo_unreadable");
      const bytes = await source.arrayBuffer();
      if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("review_photo_too_large");
      const safeBase = photo.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
      const path = `${user.id}/${Crypto.randomUUID()}-${safeBase}.jpg`;
      const uploaded = await supabase.storage.from("review-media").upload(path, bytes, { contentType: "image/jpeg" });
      if (uploaded.error) throw uploaded.error;
      photoPaths.push(path);
    }
  } catch (error) {
    if (photoPaths.length) await supabase.storage.from("review-media").remove(photoPaths);
    throw error;
  }
  const { error } = await supabase.from("vendor_reviews").insert({
    vendor_id: vendorId,
    event_id: eventId,
    author_id: user.id,
    rating,
    body: body.trim(),
    photo_paths: photoPaths,
  });
  if (error) {
    if (photoPaths.length) await supabase.storage.from("review-media").remove(photoPaths);
    throw error;
  }
}

export function reviewPhotoUrls(paths: string[] | null | undefined) {
  return (paths || []).map((path) => supabase.storage.from("review-media").getPublicUrl(path).data.publicUrl);
}

export async function replyToReview(id: string, response: string) {
  const { error } = await supabase.rpc("reply_to_vendor_review", {
    target: id,
    response,
  });
  if (error) throw error;
}
