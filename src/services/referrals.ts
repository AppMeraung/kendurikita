import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { normalizeReferralCode } from "../domain/referrals";
import { supabase } from "./supabase";

const DEVICE_KEY = "kk_referral_device";

async function deviceFingerprint() {
  if (Platform.OS === "android") {
    const id = Application.getAndroidId();
    if (id) return `android:${id}`;
  }
  if (Platform.OS === "ios") {
    const id = await Application.getIosIdForVendorAsync();
    if (id) return `ios:${id}`;
  }
  const saved = await AsyncStorage.getItem(DEVICE_KEY);
  if (saved) return saved;
  const value = `${Platform.OS}:${Date.now()}:${Math.random().toString(36).slice(2)}:${Math.random().toString(36).slice(2)}`;
  await AsyncStorage.setItem(DEVICE_KEY, value);
  return value;
}

export async function loadReferralDashboard() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const [profile, referrals] = await Promise.all([
    supabase
      .from("profiles")
      .select("role,referral_code")
      .eq("id", user.id)
      .single(),
    supabase
      .from("referrals")
      .select("id,kind,status,reward,rewarded_at,created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (profile.error) throw profile.error;
  if (referrals.error) throw referrals.error;
  return {
    role: profile.data.role as "user" | "vendor" | "admin",
    code: profile.data.referral_code as string,
    referrals: referrals.data || [],
  };
}

export async function redeemReferral(code: string) {
  const fingerprint = await deviceFingerprint();
  const { error } = await supabase.rpc("redeem_referral", {
    referral_code: normalizeReferralCode(code),
    device_fingerprint: fingerprint,
  });
  if (error) throw error;
}
