import { admin, json } from "../_shared/client.ts";
import { queueAdminAlert } from "../_shared/admin-alert.ts";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return json({ error: "method_not_allowed" }, 405);
  if (
    request.headers.get("authorization") !==
    `Bearer ${Deno.env.get("REVENUECAT_WEBHOOK_SECRET")}`
  )
    return json({ error: "unauthorized" }, 401);
  const payload = await request.json();
  const event = payload.event;
  if (!event?.id || !event?.app_user_id)
    return json({ error: "invalid_payload" }, 400);
  const entitlements = Array.isArray(event.entitlement_ids)
    ? event.entitlement_ids.filter((value: unknown) => typeof value === "string")
    : [];
  if (!entitlements.length) return json({ ok: true, ignored: "no_entitlement" });
  const attribute = (key: string) =>
    event.subscriber_attributes?.[key]?.value || null;
  const eventId = attribute("event_id");
  const vendorId = attribute("vendor_id");
  if (eventId && !uuid.test(eventId))
    return json({ error: "invalid_event_id" }, 400);
  if (vendorId && !uuid.test(vendorId))
    return json({ error: "invalid_vendor_id" }, 400);
  const expiresAt = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;
  const graceExpiresAt = event.grace_period_expiration_at_ms
    ? new Date(event.grace_period_expiration_at_ms).toISOString()
    : null;
  const effectiveExpiry = graceExpiresAt || expiresAt;
  const stillValid =
    !effectiveExpiry || new Date(effectiveExpiry).getTime() > Date.now();
  const status =
    event.type === "BILLING_ISSUE" && stillValid
      ? "grace"
      : event.type === "EXPIRATION" || !stillValid
        ? "inactive"
        : "active";
  const db = admin();
  const rows = entitlements.map((entitlement: string) => ({
    user_id: vendorId ? null : event.app_user_id,
    vendor_id: vendorId || null,
    event_id: eventId || null,
    entitlement,
    provider: "revenuecat",
    provider_customer_id: [
      event.app_user_id,
      eventId || vendorId || "global",
      entitlement,
    ].join(":"),
    status,
    expires_at: effectiveExpiry,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await db
    .from("subscriptions")
    .upsert(rows, { onConflict: "provider,provider_customer_id" });
  if (error) {
    await queueAdminAlert(db, `revenuecat:${event.id}`, `RevenueCat webhook gagal: ${error.message}`);
    return json({ error: error.message }, 500);
  }
  return json({ ok: true });
});
