export function eventInviteUrl(baseUrl: string, token: string) {
  return `${baseUrl.replace(/\/$/, "")}/join/${encodeURIComponent(token)}`;
}
