import * as Application from "expo-application";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });

export const notificationCategories = [
  "reminders",
  "rsvp",
  "messages",
  "payments",
  "vendor_leads",
  "promotions",
] as const;
type NotificationCategory = (typeof notificationCategories)[number];
export type NotificationPreferences = { categories: Record<NotificationCategory, boolean>; quietStart: string; quietEnd: string; timezone: string; promotions: boolean };
export async function configureNotificationChannels() {
  if (Platform.OS !== "android") return;
  for (const id of notificationCategories)
    await Notifications.setNotificationChannelAsync(id, {
      name: id.replace("_", " "),
      importance:
        id === "vendor_leads"
          ? // eslint-disable-next-line import/namespace
            Notifications.AndroidImportance.HIGH
          : // eslint-disable-next-line import/namespace
            Notifications.AndroidImportance.DEFAULT,
    });
}
export async function registerPushToken(userId: string, language: string) {
  if (!Device.isDevice) throw new Error("Push memerlukan peranti fizikal.");
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === "granted"
      ? current
      : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return null;
  await configureNotificationChannels();
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("EAS project ID tidak ditemui.");
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const deviceId =
    Application.getAndroidId() ||
    (Platform.OS === "ios" ? await Application.getIosIdForVendorAsync() : null) ||
    `${Device.modelName || "device"}-${Platform.OS}`;
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS,
      device_id: deviceId,
      language,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );
  if (error) throw error;
  return token;
}
export async function removePushToken(token: string) {
  await supabase.from("push_tokens").delete().eq("token", token);
}
export async function unregisterCurrentPushToken() {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted" || !Device.isDevice) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await removePushToken(token);
}
export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("sign_in_required");
  const { data, error } = await supabase.from("notification_settings").select("categories,quiet_start,quiet_end,timezone,promotions").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  const saved = (data?.categories || {}) as Partial<Record<NotificationCategory, boolean>>;
  return { categories: Object.fromEntries(notificationCategories.map((category) => [category, saved[category] !== false])) as Record<NotificationCategory, boolean>, quietStart: data?.quiet_start?.slice(0, 5) || "22:00", quietEnd: data?.quiet_end?.slice(0, 5) || "08:00", timezone: data?.timezone || "Asia/Kuala_Lumpur", promotions: data?.promotions || false };
}
export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("sign_in_required");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(preferences.quietStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(preferences.quietEnd)) throw new Error("invalid_quiet_hours");
  const { error } = await supabase.from("notification_settings").upsert({ user_id: user.id, categories: preferences.categories, quiet_start: preferences.quietStart, quiet_end: preferences.quietEnd, timezone: preferences.timezone, promotions: preferences.promotions });
  if (error) throw error;
}
export async function scheduleChecklistReminder(
  date: Date,
  title: string,
  body: string,
  taskId: string,
) {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") return null;
  await configureNotificationChannels();
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url: "/(user)/checklist", taskId } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: "reminders",
    },
  });
}
export async function cancelChecklistReminder(identifier?: string) {
  if (identifier)
    await Notifications.cancelScheduledNotificationAsync(identifier);
}
export async function schedulePaymentReminder(
  date: Date,
  title: string,
  body: string,
  paymentId: string,
) {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") return null;
  await configureNotificationChannels();
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: { url: "/(user)/payments", paymentId } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: "payments",
    },
  });
}
