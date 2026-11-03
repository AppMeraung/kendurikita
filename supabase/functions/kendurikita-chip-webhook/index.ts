import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const decode = (value: string) => {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const raw = await request.text();
  const keyText = (Deno.env.get("CHIP_PUBLIC_KEY") || "")
    .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, "");
  const keyBytes = decode(keyText);
  const signature = decode(request.headers.get("x-signature") || "");
  if (!keyBytes || !signature) return json({ error: "invalid_signature" }, 401);
  try {
    const key = await crypto.subtle.importKey(
      "spki",
      keyBytes,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      signature,
      new TextEncoder().encode(raw),
    );
    if (!valid) return json({ error: "invalid_signature" }, 401);
  } catch {
    return json({ error: "signature_verification_failed" }, 401);
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const data = event.data || {};
  const status = String(event.status || data.status || "").toLowerCase();
  const paymentId = String(event.id || data.id || "");
  const client = event.client || data.client || event.purchase?.client || {};
  const email = String(client.email || event.customer?.email || "").trim().toLowerCase();
  const products = event.purchase?.products || data.purchase?.products || event.products || data.products || [];
  const name = String(products[0]?.name || event.product?.name || "").toLowerCase();
  const isPremium = name.includes("premium");
  const isPro = name.includes("pro");
  const isYear = name.includes("tahunan") || name.includes("year");
  if (!paymentId || !email || (!isPremium && !isPro)) return json({ error: "missing_payment_identity" }, 400);

  const statuses: Record<string, string> = {
    paid: "active",
    completed: "active",
    successful: "active",
    pending: "pending",
    failed: "inactive",
    error: "inactive",
    cancelled: "inactive",
    canceled: "inactive",
    refunded: "inactive",
    expired: "inactive",
  };
  if (!statuses[status]) return json({ ok: true, ignored: true });

  const database = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "kendurikita" } },
  );
  const vendor = await database.from("vendors").select("id").ilike("email", email).maybeSingle();
  if (vendor.error) return json({ error: vendor.error.message }, 500);
  if (!vendor.data) return json({ error: "vendor_not_found" }, 404);
  const expiresAt = statuses[status] === "active"
    ? new Date(Date.now() + (isYear ? 365 : 31) * 86_400_000).toISOString()
    : null;
  const saved = await database.from("subscriptions").upsert({
    user_id: null,
    vendor_id: vendor.data.id,
    event_id: null,
    entitlement: isPremium ? "vendor_premium" : "vendor_pro",
    provider: "chip",
    provider_customer_id: paymentId,
    status: statuses[status],
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "provider,provider_customer_id" });
  if (saved.error) return json({ error: saved.error.message }, 500);
  return json({ ok: true, status: statuses[status] });
});
