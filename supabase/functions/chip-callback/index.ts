import { admin, json } from "../_shared/client.ts";
import { queueAdminAlert } from "../_shared/admin-alert.ts";

const referencePattern = /^kk:(vendor_pro|vendor_premium):(month|year):([0-9a-f-]{36})$/i;
const statusMap: Record<string, string> = { paid: "active", completed: "active", successful: "active", pending: "pending", failed: "inactive", cancelled: "inactive", canceled: "inactive", refunded: "inactive", expired: "inactive" };

function decodeBase64(value: string) {
  try { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); } catch { return null; }
}
function pemBytes(value: string) {
  return decodeBase64(value.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, ""));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const publicKey = pemBytes(Deno.env.get("CHIP_PUBLIC_KEY") || "");
  const signature = decodeBase64(request.headers.get("x-signature") || "");
  if (!publicKey || !signature) return json({ error: "invalid_signature" }, 401);
  const raw = await request.text();
  const key = await crypto.subtle.importKey("spki", publicKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, new TextEncoder().encode(raw));
  if (!valid) return json({ error: "invalid_signature" }, 401);
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }
  const paymentId = typeof payload.id === "string" ? payload.id : "";
  const status = typeof payload.status === "string" ? payload.status.toLowerCase() : "";
  const match = typeof payload.reference === "string" ? payload.reference.match(referencePattern) : null;
  if (!paymentId || !statusMap[status] || !match) return json({ error: "invalid_payload" }, 400);
  const [, entitlement, period, ownerId] = match;
  const db = admin();
  const vendor = await db.from("vendors").select("id").eq("owner_id", ownerId).maybeSingle();
  if (vendor.error) return json({ error: vendor.error.message }, 500);
  if (!vendor.data) return json({ error: "vendor_not_found" }, 404);
  const existing = await db.from("subscriptions").select("status,expires_at").eq("provider", "chip").eq("provider_customer_id", paymentId).maybeSingle();
  if (existing.error) return json({ error: existing.error.message }, 500);
  const calculatedExpiry = statusMap[status] === "active"
    ? new Date(Date.now() + (period === "year" ? 365 : 31) * 86_400_000).toISOString()
    : null;
  const expiresAt = existing.data?.status === "active" && existing.data.expires_at
    ? existing.data.expires_at
    : calculatedExpiry;
  const result = await db.from("subscriptions").upsert({
    user_id: null, vendor_id: vendor.data.id, event_id: null, entitlement: entitlement.toLowerCase(),
    provider: "chip", provider_customer_id: paymentId, status: statusMap[status], expires_at: expiresAt, updated_at: new Date().toISOString(),
  }, { onConflict: "provider,provider_customer_id" });
  if (result.error) {
    await queueAdminAlert(db, `chip:${paymentId}`, `CHIP callback gagal: ${result.error.message}`);
    return json({ error: result.error.message }, 500);
  }
  return json({ ok: true });
});
