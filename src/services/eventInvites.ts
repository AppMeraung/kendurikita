import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventInviteUrl } from "../domain/eventInvite";
import { supabase } from "./supabase";

export type CloudMemberRole = "partner" | "editor" | "viewer" | "parent";
const PENDING_INVITE = "kk_pending_event_invite";

export async function rememberPendingEventInvite(token: string) {
  if (token) await AsyncStorage.setItem(PENDING_INVITE, token);
}

export async function pendingEventInvitePath() {
  const token = await AsyncStorage.getItem(PENDING_INVITE);
  return token ? `/join/${encodeURIComponent(token)}` : null;
}

export async function clearPendingEventInvite() {
  await AsyncStorage.removeItem(PENDING_INVITE);
}

export async function createEventInvite(eventId: string, role: CloudMemberRole) {
  const { data, error } = await supabase.rpc("create_event_invite", { target_event: eventId, target_role: role });
  if (error) throw error;
  const base = process.env.EXPO_PUBLIC_WEB_URL || Linking.createURL("").replace(/\/$/, "");
  return eventInviteUrl(base, String(data));
}

export async function acceptEventInvite(token: string) {
  const { data, error } = await supabase.rpc("accept_event_invite", { invite_token: token });
  if (error) throw error;
  await clearPendingEventInvite();
  return String(data);
}
