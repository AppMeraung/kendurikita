import { EventData } from "../state/AppState";
import { invitationUrl } from "../domain/invitation";
import { supabase } from "./supabase";

export type GuestInvitation = {
  guestId: string;
  name: string;
  phone?: string;
  url: string;
};

export async function publishInvitations(event: EventData, eventId: string) {
  let photoUrl = event.invitation.photoUri || null;
  if (photoUrl && !/^https?:\/\//.test(photoUrl)) {
    const response = await fetch(photoUrl);
    if (!response.ok) throw new Error("Foto jemputan tidak dapat dibaca.");
    const extension = photoUrl.split(".").pop()?.split("?")[0] || "jpg";
    const path = `${eventId}/cover.${extension}`;
    const upload = await supabase.storage
      .from("invitation-media")
      .upload(path, await response.arrayBuffer(), {
        contentType: response.headers.get("content-type") || "image/jpeg",
        upsert: true,
      });
    if (upload.error) throw upload.error;
    photoUrl = supabase.storage.from("invitation-media").getPublicUrl(path)
      .data.publicUrl;
  }
  let duitNowQrUrl = event.invitation.duitNowQrUri || null;
  if (duitNowQrUrl && !/^https?:\/\//.test(duitNowQrUrl)) {
    const response = await fetch(duitNowQrUrl);
    if (!response.ok) throw new Error("Kod QR DuitNow tidak dapat dibaca.");
    const extension = duitNowQrUrl.split(".").pop()?.split("?")[0] || "jpg";
    const path = `${eventId}/duitnow.${extension}`;
    const upload = await supabase.storage.from("invitation-media").upload(path, await response.arrayBuffer(), { contentType: response.headers.get("content-type") || "image/jpeg", upsert: true });
    if (upload.error) throw upload.error;
    duitNowQrUrl = supabase.storage.from("invitation-media").getPublicUrl(path).data.publicUrl;
  }
  const { data: guests, error } = await supabase
    .from("guests")
    .select("id,local_key,name,phone,invitation_token")
    .eq("event_id", eventId);
  if (error) throw error;
  const content = {
    message: event.invitation.message,
    photo_url: photoUrl,
    music_url: event.invitation.musicUrl || null,
    gift_link: event.invitation.giftLink || null,
    duitnow_qr_url: duitNowQrUrl,
    wishlist: event.invitation.wishlist || null,
  };
  const rows = (guests || []).map((guest) => ({
    event_id: eventId,
    guest_id: guest.id,
    language: event.invitation.language,
    template_id: event.invitation.template,
    content,
  }));
  if (rows.length) {
    const result = await supabase.from("invitations").upsert(rows, {
      onConflict: "event_id,guest_id",
    });
    if (result.error) throw result.error;
  }
  const baseUrl = process.env.EXPO_PUBLIC_WEB_URL;
  if (!baseUrl) throw new Error("EXPO_PUBLIC_WEB_URL belum dikonfigurasi.");
  return (guests || []).map((guest): GuestInvitation => ({
    guestId: guest.local_key,
    name: guest.name,
    phone: guest.phone || undefined,
    url: invitationUrl(baseUrl, guest.invitation_token),
  }));
}
