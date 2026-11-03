export type PasswordMode = "signIn" | "signUp" | "reset" | "newPassword";
export type PasswordAuthError = "invalidEmail" | "passwordTooShort" | "passwordMismatch";

/** Returns the i18n key of the first problem with the form, or null when it can be sent. */
export function passwordAuthError(
  mode: PasswordMode,
  form: { email: string; password: string; confirm?: string },
): PasswordAuthError | null {
  if (mode !== "newPassword" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "invalidEmail";
  if (mode === "reset") return null;
  if (form.password.length < 8) return "passwordTooShort";
  if ((mode === "signUp" || mode === "newPassword") && form.password !== form.confirm) return "passwordMismatch";
  return null;
}
