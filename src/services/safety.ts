import { supabase } from "./supabase";

export type ReportTarget = "vendor" | "review" | "portfolio" | "user" | "message";
export type ChatSafetyContext = {
  other_user_id: string;
  other_name: string;
  blocked_by_me: boolean;
  blocked_me: boolean;
};

export async function submitReport(targetType: ReportTarget, targetId: string, reason: string, details: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { error } = await supabase.from("moderation_reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: reason.trim(),
    details: details.trim() || null,
  });
  if (error) throw error;
}

export async function loadChatSafetyContext(leadId: string) {
  const { data, error } = await supabase.rpc("get_chat_safety_context", { target_lead: leadId });
  if (error) throw error;
  return data as ChatSafetyContext;
}

export async function setChatPartyBlocked(leadId: string, blocked: boolean) {
  const { error } = await supabase.rpc("set_chat_party_block", { target_lead: leadId, should_block: blocked });
  if (error) throw error;
}
