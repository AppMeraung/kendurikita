export async function queueAdminAlert(db: ReturnType<typeof import("./client.ts")["admin"]>, key: string, message: string) {
  const { data } = await db.from("profiles").select("id").eq("role", "admin");
  if (!data?.length) return;
  await db.from("notification_jobs").upsert(data.map((admin) => ({ user_id: admin.id, category: "payments", template: "admin_alert", variables: { message }, deep_link: "kendurikita://admin", urgent: true, dedupe_key: `webhook:${key}:${admin.id}` })), { onConflict: "dedupe_key", ignoreDuplicates: true });
}
