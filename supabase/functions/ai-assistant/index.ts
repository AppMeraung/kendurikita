import { admin, json } from "../_shared/client.ts";

const blocked =
  /sexual content involving minors|self-harm instructions|suicide method|instructions? (?:to|for) (?:kill|attack|harm)|buat bom|cara bunuh/i;
const allowedKinds = new Set([
  "invitation",
  "speech",
  "pantun",
  "thank_you",
  "timeline",
  "checklist",
]);
const allowedLanguages = new Set(["ms", "en", "zh", "ta", "id"]);

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return json({ error: "method_not_allowed" }, 405);
  const token = (request.headers.get("authorization") || "").replace(
    "Bearer ",
    "",
  );
  const db = admin();
  const {
    data: { user },
  } = await db.auth.getUser(token);
  if (!user) return json({ error: "unauthorized" }, 401);
  const { prompt, language = "ms", kind = "invitation" } = await request.json();
  if (
    typeof prompt !== "string" ||
    prompt.trim().length < 3 ||
    prompt.length > 2000 ||
    blocked.test(prompt) ||
    !allowedKinds.has(kind) ||
    !allowedLanguages.has(language)
  )
    return json({ error: "unsafe_or_invalid_prompt" }, 400);
  const { data: plans, error: planError } = await db
    .from("subscriptions")
    .select("entitlement,expires_at")
    .eq("user_id", user.id)
    .in("status", ["active", "grace"]);
  if (planError) return json({ error: "entitlement_check_failed" }, 500);
  const premium = (plans || []).some(
    (plan) =>
      String(plan.entitlement).toLowerCase().includes("premium") &&
      (!plan.expires_at || new Date(plan.expires_at).getTime() > Date.now()),
  );
  if (!premium) return json({ error: "premium_required" }, 403);
  const month = new Date().toISOString().slice(0, 7) + "-01";
  const quota = await db.rpc("consume_ai_quota", {
    target_user: user.id,
    target_month: month,
    monthly_limit: 30,
  });
  if (quota.error) {
    const limited = quota.error.message.includes("monthly_limit");
    return json(
      { error: limited ? "monthly_limit" : "quota_failure" },
      limited ? 429 : 500,
    );
  }
  const apiUrl = Deno.env.get("AI_API_URL");
  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiUrl || !apiKey)
    return json({ error: "provider_not_configured" }, 503);
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      authorization: "Bearer " + apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      prompt:
        "Create " +
        kind +
        " content in " +
        language +
        ". Return plain text only. User request: " +
        prompt.trim(),
    }),
  });
  if (!response.ok) return json({ error: "provider_failure" }, 502);
  const payload = await response.json();
  const content =
    typeof payload === "string"
      ? payload
      : payload.text || payload.output || payload.result;
  if (typeof content !== "string" || !content.trim() || blocked.test(content))
    return json({ error: "unsafe_provider_output" }, 502);
  return json({
    label: "dijana AI",
    content: content.trim().slice(0, 8000),
    used: quota.data,
    limit: 30,
  });
});
