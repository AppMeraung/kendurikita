import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const cloudConfigured = Boolean(url && anonKey);
const serverStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => undefined,
  removeItem: async (_key: string) => undefined,
};
const authStorage =
  typeof window === "undefined" ? serverStorage : AsyncStorage;
const PENDING_ROLE = "kk_pending_auth_role";

export const supabase = createClient(
  url || "https://invalid.local",
  anonKey || "missing",
  {
    db: { schema: "kendurikita" },
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  },
);

export type AccountRole = "user" | "vendor";

async function applyPendingRole(role?: AccountRole) {
  const selected =
    role || ((await AsyncStorage.getItem(PENDING_ROLE)) as AccountRole | null);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && (selected === "user" || selected === "vendor")) {
    // Role selection on login must not overwrite privileged accounts.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "admin" && profile?.role !== "superadmin") {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selected })
        .eq("id", user.id);
      if (error) throw error;
    }
  }
  await AsyncStorage.removeItem(PENDING_ROLE);
}

export async function completeOAuthCallback(callbackUrl: string) {
  const code = new URL(callbackUrl).searchParams.get("code");
  if (!code) throw new Error("Kod log masuk tidak ditemui.");
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  await applyPendingRole();
}

export async function sendEmailOtp(email: string, role: AccountRole) {
  if (!cloudConfigured)
    throw new Error("Supabase belum dikonfigurasi. Lihat SETUP.md.");
  return supabase.auth.signInWithOtp({
    email,
    options: {
      data: { role },
      emailRedirectTo: Linking.createURL("auth/callback"),
    },
  });
}

export async function signInWithPassword(
  email: string,
  password: string,
  role: AccountRole,
) {
  if (!cloudConfigured)
    throw new Error("Supabase belum dikonfigurasi. Lihat SETUP.md.");
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (!result.error) await applyPendingRole(role);
  return result;
}

/** `session` is null when the project asks the new user to confirm their email first. */
export async function signUpWithPassword(
  email: string,
  password: string,
  role: AccountRole,
) {
  if (!cloudConfigured)
    throw new Error("Supabase belum dikonfigurasi. Lihat SETUP.md.");
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
      emailRedirectTo: Linking.createURL("auth/callback"),
    },
  });
  if (!result.error && result.data.session) await applyPendingRole(role);
  return result;
}

export async function sendPasswordReset(email: string) {
  if (!cloudConfigured)
    throw new Error("Supabase belum dikonfigurasi. Lihat SETUP.md.");
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Linking.createURL("auth/reset-password"),
  });
}

/** Signs in from the reset link's code so the new password can be saved. */
export async function startPasswordRecovery(code: string) {
  return supabase.auth.exchangeCodeForSession(code);
}

export async function saveNewPassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function sendPhoneOtp(phone: string, role: AccountRole) {
  if (!cloudConfigured)
    throw new Error("Supabase belum dikonfigurasi. Lihat SETUP.md.");
  return supabase.auth.signInWithOtp({
    phone,
    options: { data: { role } },
  });
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
  role: AccountRole,
) {
  const result = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (!result.error) await applyPendingRole(role);
  return result;
}

export async function signInWithProvider(
  provider: "google" | "apple",
  role: AccountRole,
) {
  if (!cloudConfigured)
    throw new Error("Supabase belum dikonfigurasi. Lihat SETUP.md.");
  if (provider === "apple" && Platform.OS === "ios") {
    const nonce = Crypto.randomUUID();
    const credential = await AppleAuthentication.signInAsync({
      nonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken)
      throw new Error("Apple tidak memulangkan token identiti.");
    const result = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce,
      access_token: credential.authorizationCode || undefined,
    });
    if (result.error) throw result.error;
    await applyPendingRole(role);
    const fullName = [
      credential.fullName?.givenName,
      credential.fullName?.middleName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(" ");
    if (fullName)
      await supabase.auth.updateUser({
        data: {
          name: fullName,
          given_name: credential.fullName?.givenName,
          family_name: credential.fullName?.familyName,
        },
      });
    return { error: null };
  }
  await AsyncStorage.setItem(PENDING_ROLE, role);
  const redirectTo = Linking.createURL("auth/callback");
  const result = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (result.error) return { error: result.error };
  if (!result.data.url)
    return { error: new Error("URL log masuk tidak ditemui.") };
  const session = await WebBrowser.openAuthSessionAsync(
    result.data.url,
    redirectTo,
  );
  if (session.type !== "success")
    return { error: new Error("Log masuk dibatalkan.") };
  await completeOAuthCallback(session.url);
  return { error: null };
}
