import { Platform } from "react-native";
import Purchases, { CustomerInfo } from "react-native-purchases";

const apiKey = Platform.OS === "ios" ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
export const purchasesConfigured = Boolean(apiKey);
let configured = false;

export async function configurePurchases(userId?: string) {
  if (!apiKey || Platform.OS === "web") return false;
  if (!configured) {
    Purchases.configure({ apiKey });
    configured = true;
  }
  if (userId && (await Purchases.getAppUserID()) !== userId) await Purchases.logIn(userId);
  return true;
}

async function requireConfigured() {
  if (!(await configurePurchases())) throw new Error("RevenueCat belum dikonfigurasi untuk platform ini.");
}

export async function identifyPurchaser(userId?: string) {
  return configurePurchases(userId);
}

export async function setPurchaseContext(input: { eventId?: string; vendorId?: string }) {
  await requireConfigured();
  const attributes: Record<string, string> = {};
  if (input.eventId) attributes.event_id = input.eventId;
  if (input.vendorId) attributes.vendor_id = input.vendorId;
  if (Object.keys(attributes).length) await Purchases.setAttributes(attributes);
}

export async function customerInfo(): Promise<CustomerInfo | null> {
  if (!purchasesConfigured || Platform.OS === "web") return null;
  await requireConfigured();
  return Purchases.getCustomerInfo();
}

export async function activeEntitlements() {
  return (await customerInfo())?.entitlements.active || {};
}

export async function restorePurchases() {
  await requireConfigured();
  return Purchases.restorePurchases();
}

export async function currentOffering() {
  await requireConfigured();
  return (await Purchases.getOfferings()).current;
}

export async function purchasePackage(identifier: string) {
  const offering = await currentOffering();
  const selected = offering?.availablePackages.find((item) => item.identifier === identifier);
  if (!selected) throw new Error("Pakej tidak ditemui dalam offering aktif.");
  return Purchases.purchasePackage(selected);
}

export function subscriptionManagementUrl() {
  return Platform.OS === "ios" ? "https://apps.apple.com/account/subscriptions" : "https://play.google.com/store/account/subscriptions";
}
export async function logOutPurchaser() {
  if (!configured) return;
  if (!(await Purchases.isAnonymous())) await Purchases.logOut();
}
