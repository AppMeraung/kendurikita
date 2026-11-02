export function invitationUrl(baseUrl: string, token: string) {
  return `${baseUrl.replace(/\/$/, "")}/rsvp/${encodeURIComponent(token)}`;
}

export function invitationShareText(
  message: string,
  guestName: string,
  url: string,
) {
  return [message.trim(), guestName.trim(), url].filter(Boolean).join("\n\n");
}

export function whatsappUrl(phone: string | undefined, text: string) {
  const number = (phone || "").replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
