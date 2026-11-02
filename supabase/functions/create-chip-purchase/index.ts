import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { admin, json } from "../_shared/client.ts";

type Plan = "vendor_pro" | "vendor_premium";
type Period = "month" | "year";
const plans = new Set<Plan>(["vendor_pro", "vendor_premium"]);
const periods = new Set<Period>(["month", "year"]);

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (Deno.env.get("CHIP_VENDOR_PAYMENTS_ENABLED") !== "true") return json({ error: "chip_payments_disabled" }, 503);
  const token = request.headers.get("authorization") || "";
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    db: { schema: "kendurikita" }, auth: { persistSession: false }, global: { headers: { Authorization: token } },
  });
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return json({ error: "not_authenticated" }, 401);
  let body: { plan?: string; period?: string };
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (!plans.has(body.plan as Plan) || !periods.has(body.period as Period)) return json({ error: "invalid_plan" }, 400);
  const plan = body.plan as Plan;
  const period = body.period as Period;
  const price = Number(Deno.env.get(`CHIP_${plan.toUpperCase()}_${period.toUpperCase()}_SEN`));
  if (!Number.isSafeInteger(price) || price <= 0) return json({ error: "price_not_configured" }, 503);
  const brandId = Deno.env.get("CHIP_BRAND_ID");
  const apiKey = Deno.env.get("CHIP_API_KEY");
  const webUrl = Deno.env.get("PUBLIC_WEB_URL")?.replace(/\/$/, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  if (!brandId || !apiKey || !webUrl || !supabaseUrl) return json({ error: "chip_not_configured" }, 503);
  const vendor = await admin().from("vendors").select("id,company_name").eq("owner_id", auth.user.id).maybeSingle();
  if (vendor.error) return json({ error: vendor.error.message }, 500);
  if (!vendor.data) return json({ error: "vendor_profile_required" }, 409);
  if (!auth.user.email) return json({ error: "email_required" }, 409);
  const reference = `kk:${plan}:${period}:${auth.user.id}`;
  const response = await fetch("https://gate.chip-in.asia/api/v1/purchases/", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      brand_id: brandId,
      client: { email: auth.user.email, full_name: vendor.data.company_name },
      purchase: { currency: "MYR", language: "en", products: [{ name: `${plan === "vendor_pro" ? "Vendor Pro" : "Vendor Premium"} (${period})`, price }] },
      reference,
      success_redirect: `${webUrl}/vendor-plans?chip=success`,
      failure_redirect: `${webUrl}/vendor-plans?chip=failed`,
      cancel_redirect: `${webUrl}/vendor-plans?chip=cancelled`,
      success_callback: `${supabaseUrl}/functions/v1/chip-callback`,
      platform: "web",
    }),
  });
  const purchase = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: "chip_purchase_failed", details: purchase }, 502);
  const purchaseId = typeof purchase.id === "string" ? purchase.id : "";
  const checkoutUrl = typeof purchase.checkout_url === "string" ? purchase.checkout_url : "";
  if (!purchaseId || !checkoutUrl) return json({ error: "invalid_chip_response" }, 502);
  const pending = await admin().from("subscriptions").upsert({
    vendor_id: vendor.data.id, entitlement: plan, provider: "chip", provider_customer_id: purchaseId,
    status: "pending", updated_at: new Date().toISOString(),
  }, { onConflict: "provider,provider_customer_id" });
  if (pending.error) return json({ error: pending.error.message }, 500);
  return json({ checkout_url: checkoutUrl });
});
