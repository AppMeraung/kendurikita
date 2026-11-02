import * as Linking from "expo-linking";
import { supabase } from "./supabase";

export type ChatMessage = {
  id: string;
  body?: string;
  attachment_path?: string;
  sender_id: string;
  read_at?: string;
  created_at: string;
};
export async function loadMessages(leadId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id,body,attachment_path,sender_id,read_at,created_at")
    .eq("lead_id", leadId)
    .order("created_at");
  if (error) throw error;
  await supabase.rpc("mark_lead_messages_read", { target: leadId });
  return (data || []) as ChatMessage[];
}
export async function sendMessage(
  leadId: string,
  body: string,
  attachment?: { uri: string; name: string; mimeType: string },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  let path: string | null = null;
  if (attachment) {
    const source = await fetch(attachment.uri);
    if (!source.ok) throw new Error("Lampiran tidak dapat dibaca.");
    path = `${leadId}/${Date.now()}-${attachment.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
    const upload = await supabase.storage
      .from("chat-attachments")
      .upload(path, await source.arrayBuffer(), {
        contentType: attachment.mimeType,
      });
    if (upload.error) throw upload.error;
  }
  const { error } = await supabase
    .from("messages")
    .insert({
      lead_id: leadId,
      sender_id: user.id,
      body: body.trim() || null,
      attachment_path: path,
    });
  if (error) {
    if (path) await supabase.storage.from("chat-attachments").remove([path]);
    throw error;
  }
}
export async function openChatAttachment(path: string) {
  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(path, 300);
  if (error) throw error;
  await Linking.openURL(data.signedUrl);
}
export function subscribeMessages(leadId: string, onChange: () => void) {
  return supabase
    .channel(`messages:${leadId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "kendurikita",
        table: "messages",
        filter: `lead_id=eq.${leadId}`,
      },
      onChange,
    )
    .subscribe();
}
