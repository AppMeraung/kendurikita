export const aiKinds = [
  "invitation",
  "speech",
  "pantun",
  "thank_you",
  "timeline",
  "checklist",
] as const;
export type AiKind = (typeof aiKinds)[number];

export function validAiPrompt(prompt: string) {
  const length = prompt.trim().length;
  return length >= 3 && length <= 2000;
}
