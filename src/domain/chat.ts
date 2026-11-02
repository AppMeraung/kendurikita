export const MAX_CHAT_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export function validChatAttachment(mimeType?: string, size?: number) {
  const allowed =
    mimeType === "application/pdf" || Boolean(mimeType?.startsWith("image/"));
  return (
    allowed && Boolean(size && size > 0 && size <= MAX_CHAT_ATTACHMENT_BYTES)
  );
}
export function validChatMessage(body: string, hasAttachment: boolean) {
  return Boolean(body.trim()) || hasAttachment;
}
