import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type { EventData } from "../state/AppState";
import { cloudConfigured, supabase } from "./supabase";
import { syncEvent } from "./sync";

const QUEUE_KEY = "kendurikita_pending_cloud_event_v1";
let flushing: Promise<boolean> | null = null;

export async function queueEventSync(event: EventData) {
  if (!event.cloudId || !cloudConfigured) return;
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(event));
  const network = await NetInfo.fetch();
  if (network.isConnected) void flushEventSync();
}

export async function flushEventSync() {
  if (flushing) return flushing;
  flushing = (async () => {
    if (!cloudConfigured) return false;
    const network = await NetInfo.fetch();
    if (!network.isConnected) return false;
    const pending = await AsyncStorage.getItem(QUEUE_KEY);
    if (!pending) return true;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return false;
    const event = JSON.parse(pending) as EventData;
    await syncEvent(event);
    const current = await AsyncStorage.getItem(QUEUE_KEY);
    if (current === pending) await AsyncStorage.removeItem(QUEUE_KEY);
    return true;
  })().catch(() => false).finally(() => { flushing = null; });
  return flushing;
}

export function listenForQueuedSync() {
  void flushEventSync();
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) void flushEventSync();
  });
}

export async function hasPendingEventSync() {
  return Boolean(await AsyncStorage.getItem(QUEUE_KEY));
}
