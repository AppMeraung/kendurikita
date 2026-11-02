import { supabase } from "./supabase";

export async function loadFamilyContributions(eventId: string) {
  const { data, error } = await supabase
    .from("budget_contributions")
    .select("id,amount,note,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addFamilyContribution(
  eventId: string,
  amount: number,
  note: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const { error } = await supabase.from("budget_contributions").insert({
    event_id: eventId,
    contributor_id: user.id,
    amount,
    note: note.trim() || null,
  });
  if (error) throw error;
}
