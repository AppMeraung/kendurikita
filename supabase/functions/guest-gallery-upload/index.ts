import { admin, json } from "../_shared/client.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return json({ error: "method_not_allowed" }, 405);
  const token = request.headers.get("x-invitation-token") || "";
  if (!/^[0-9a-f-]{36}$/i.test(token))
    return json({ error: "invalid_token" }, 400);
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("image/"))
    return json({ error: "invalid_type" }, 400);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > 10 * 1024 * 1024)
    return json({ error: "invalid_size" }, 400);
  const db = admin();
  const { data: guest } = await db
    .schema("kendurikita")
    .from("guests")
    .select("id,event_id")
    .eq("invitation_token", token)
    .single();
  if (!guest) return json({ error: "invalid_token" }, 404);
  const { data: plan, error: planError } = await db
    .schema("kendurikita")
    .rpc("event_plan", { target: guest.event_id });
  if (planError) return json({ error: "entitlement_check_failed" }, 500);
  if (plan !== "premium") return json({ error: "premium_required" }, 403);
  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${guest.event_id}/guest-${guest.id}-${crypto.randomUUID()}.${extension}`;
  const upload = await db.storage
    .from("guest-gallery")
    .upload(path, bytes, { contentType });
  if (upload.error) return json({ error: upload.error.message }, 500);
  const inserted = await db
    .schema("kendurikita")
    .from("event_gallery")
    .insert({
      event_id: guest.event_id,
      guest_id: guest.id,
      storage_path: path,
    });
  if (inserted.error) {
    await db.storage.from("guest-gallery").remove([path]);
    return json({ error: inserted.error.message }, 500);
  }
  return json({ ok: true });
});
