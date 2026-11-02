import { supabase } from "./supabase";

export type GalleryPhoto = {
  id: string;
  url: string;
  caption?: string;
  guestName?: string;
  path: string;
};
export type GuestWish = {
  id: string;
  guestName: string;
  message: string;
  respondedAt: string;
};

export async function loadPostEvent(eventId: string) {
  const [galleryResult, wishResult] = await Promise.all([
    supabase
      .from("event_gallery")
      .select("id,storage_path,caption,guests(name)")
      .eq("event_id", eventId)
      .eq("approved", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("rsvps")
      .select("id,message,responded_at,guests!inner(name,event_id)")
      .eq("guests.event_id", eventId)
      .not("message", "is", null)
      .order("responded_at", { ascending: false }),
  ]);
  if (galleryResult.error) throw galleryResult.error;
  if (wishResult.error) throw wishResult.error;
  const gallery = await Promise.all(
    (galleryResult.data || []).map(
      async (photo: any): Promise<GalleryPhoto> => {
        const signed = await supabase.storage
          .from("guest-gallery")
          .createSignedUrl(photo.storage_path, 3600);
        if (signed.error) throw signed.error;
        return {
          id: photo.id,
          path: photo.storage_path,
          url: signed.data.signedUrl,
          caption: photo.caption || undefined,
          guestName: photo.guests?.name || undefined,
        };
      },
    ),
  );
  const wishes = (wishResult.data || []).map((wish: any): GuestWish => ({
    id: wish.id,
    guestName: wish.guests.name,
    message: wish.message,
    respondedAt: wish.responded_at,
  }));
  return { gallery, wishes };
}

export async function uploadGuestPhoto(
  token: string,
  uri: string,
  mimeType = "image/jpeg",
) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase belum dikonfigurasi.");
  const source = await fetch(uri);
  if (!source.ok) throw new Error("Foto tidak dapat dibaca.");
  const response = await fetch(`${url}/functions/v1/guest-gallery-upload`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "x-invitation-token": token,
      "content-type": mimeType,
    },
    body: await source.arrayBuffer(),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Muat naik gagal.");
}
