import { describe, expect, it } from "vitest";
import { passwordAuthError, signUpOutcome } from "./passwordAuth";

const ok = { email: "ali@contoh.my", password: "rahsia123", confirm: "rahsia123" };

describe("password sign-in and sign-up checks", () => {
  it("accepts a valid sign-in and sign-up", () => {
    expect(passwordAuthError("signIn", ok)).toBeNull();
    expect(passwordAuthError("signUp", ok)).toBeNull();
  });
  it("needs a valid email for every mode", () => {
    for (const mode of ["signIn", "signUp", "reset"] as const)
      expect(passwordAuthError(mode, { ...ok, email: "ali" })).toBe("invalidEmail");
  });
  it("reset only needs the email", () => {
    expect(passwordAuthError("reset", { email: "ali@contoh.my", password: "" })).toBeNull();
  });
  it("needs a password of at least 8 characters", () => {
    expect(passwordAuthError("signIn", { ...ok, password: "" })).toBe("passwordTooShort");
    expect(passwordAuthError("signUp", { ...ok, password: "1234567", confirm: "1234567" })).toBe("passwordTooShort");
  });
  it("sign-up and a new password must be confirmed", () => {
    expect(passwordAuthError("signUp", { ...ok, confirm: "lain" })).toBe("passwordMismatch");
    expect(passwordAuthError("newPassword", { email: "", password: "rahsia123", confirm: "rahsia124" })).toBe("passwordMismatch");
    expect(passwordAuthError("newPassword", { email: "", password: "rahsia123", confirm: "rahsia123" })).toBeNull();
  });
});

describe("signUpOutcome", () => {
  it("signs in straight away when a session comes back", () =>
    expect(signUpOutcome({ session: {}, user: { identities: [{}] } })).toBe("signedIn"));
  it("flags an email that is already registered (no identities, no email sent)", () =>
    expect(signUpOutcome({ session: null, user: { identities: [] } })).toBe("existingAccount"));
  it("asks a new user to check their email", () =>
    expect(signUpOutcome({ session: null, user: { identities: [{}] } })).toBe("checkEmail"));
  it("falls back to check email when identities are missing", () =>
    expect(signUpOutcome({ session: null, user: null })).toBe("checkEmail"));
});
