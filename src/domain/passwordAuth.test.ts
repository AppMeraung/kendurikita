import { describe, expect, it } from "vitest";
import { passwordAuthError } from "./passwordAuth";

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
