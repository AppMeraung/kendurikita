const videoHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "tiktok.com",
  "www.tiktok.com",
]);

export function validPortfolioVideo(url: string) {
  if (!url.trim()) return false;
  try {
    const value = new URL(url);
    return value.protocol === "https:" && videoHosts.has(value.hostname);
  } catch {
    return false;
  }
}

export function validReview(rating: number, body: string) {
  const length = body.trim().length;
  return (
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5 &&
    length >= 3 &&
    length <= 1000
  );
}
