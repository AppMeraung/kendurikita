export function normalizeReferralCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function validReferralCode(value: string) {
  return /^[A-Z0-9]{10}$/.test(normalizeReferralCode(value));
}

export function referralProgress(kind: "user" | "vendor", active: number) {
  const target = kind === "user" ? 3 : 1;
  return { target, active: Math.min(target, Math.max(0, active)) };
}
