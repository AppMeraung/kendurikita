export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function validEventDocument(mimeType?: string, size?: number) {
  const allowed =
    mimeType === "application/pdf" || Boolean(mimeType?.startsWith("image/"));
  return (
    allowed && (size === undefined || (size > 0 && size <= MAX_DOCUMENT_BYTES))
  );
}
