const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "youtu.be"]);

export function validHelpVideo(url: string) {
  if (!url.trim()) return false;
  try {
    const value = new URL(url);
    return value.protocol === "https:" && youtubeHosts.has(value.hostname);
  } catch {
    return false;
  }
}
