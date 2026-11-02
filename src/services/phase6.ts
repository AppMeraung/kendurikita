import { supabase } from "./supabase";

export type MasKahwinRate = {
  state: string;
  amount: number;
  typical_hantaran_min: number | null;
  typical_hantaran_max: number | null;
  source_url: string;
  checked_at: string;
};

export async function loadMasKahwinRates() {
  const { data, error } = await supabase
    .from("mas_kahwin_rates")
    .select(
      "state,amount,typical_hantaran_min,typical_hantaran_max,source_url,checked_at",
    )
    .order("state");
  if (error) throw error;
  return (data || []) as MasKahwinRate[];
}

export async function loadSavingsGoal(eventId: string) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("target,current_amount,reminder_day")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveSavingsGoal(
  eventId: string,
  target: number,
  currentAmount: number,
  reminderDay: number,
) {
  const { error } = await supabase.from("savings_goals").upsert(
    {
      event_id: eventId,
      target,
      current_amount: currentAmount,
      reminder_day: reminderDay,
    },
    { onConflict: "event_id" },
  );
  if (error) throw error;
}
