import { AiKind } from "../domain/aiAssistant";
import { Language } from "../i18n";
import { supabase } from "./supabase";

export async function generateAiContent(
  prompt: string,
  kind: AiKind,
  language: Language,
) {
  const { data, error } = await supabase.functions.invoke("ai-assistant", {
    body: { prompt, kind, language },
  });
  if (error) throw error;
  if (!data?.content) throw new Error(data?.error || "empty_response");
  return data as {
    label: string;
    content: string;
    used: number;
    limit: number;
  };
}
