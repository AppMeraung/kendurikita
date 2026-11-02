import { admin, json } from "../_shared/client.ts";

const allowedLanguages = new Set(["ms", "en", "zh", "ta", "id"]);

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = (request.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: { user } } = await admin().auth.getUser(token);
  if (!user) return json({ error: "unauthorized" }, 401);
  const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!key) return json({ error: "places_not_configured" }, 503);
  let body: { action?: string; query?: string; place?: string; language?: string; country?: string };
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const language = allowedLanguages.has(body.language || "") ? body.language! : "ms";
  if (body.action === "search") {
    const query = body.query?.trim() || "";
    if (query.length < 3 || query.length > 200) return json({ error: "invalid_query" }, 400);
    const country = body.country === "ID" ? "id" : "my";
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "suggestions.placePrediction.place,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({ input: query, languageCode: language, includedRegionCodes: [country] }),
    });
    if (!response.ok) return json({ error: "places_search_failed" }, 502);
    const payload = await response.json();
    const suggestions = (payload.suggestions || []).flatMap((entry: Record<string, unknown>) => {
      const prediction = entry.placePrediction as { place?: string; text?: { text?: string } } | undefined;
      return prediction?.place && prediction.text?.text ? [{ place: prediction.place, text: prediction.text.text }] : [];
    }).slice(0, 5);
    return json({ suggestions });
  }
  if (body.action === "details" && /^places\/[A-Za-z0-9_-]+$/.test(body.place || "")) {
    const response = await fetch(`https://places.googleapis.com/v1/${body.place}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "id,formattedAddress,location",
        "Accept-Language": language,
      },
    });
    if (!response.ok) return json({ error: "place_details_failed" }, 502);
    const payload = await response.json();
    if (!payload.id || !payload.formattedAddress || !Number.isFinite(payload.location?.latitude) || !Number.isFinite(payload.location?.longitude)) return json({ error: "invalid_place_details" }, 502);
    return json({ placeId: payload.id, name: payload.formattedAddress, latitude: payload.location.latitude, longitude: payload.location.longitude });
  }
  return json({ error: "invalid_action" }, 400);
});
