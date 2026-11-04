import { File, Paths } from "expo-file-system";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { EventDocument } from "../domain";
import { supabase } from "./supabase";

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, "-");

export async function uploadEventDocument(
  eventId: string,
  document: EventDocument,
) {
  if (document.storagePath) return document.storagePath;
  if (!document.localUri) throw new Error("Fail tempatan tidak ditemui.");
  const response = await fetch(document.localUri);
  if (!response.ok) throw new Error("Fail tidak dapat dibaca.");
  const path = `${eventId}/${document.id}-${safeName(document.name)}`;
  const { error } = await supabase.storage
    .from("event-docs")
    .upload(path, await response.arrayBuffer(), {
      contentType: document.mimeType || "application/octet-stream",
      upsert: true,
    });
  if (error) throw error;
  return path;
}

export async function openEventDocument(document: EventDocument) {
  if (document.localUri) return Linking.openURL(document.localUri);
  if (!document.storagePath) throw new Error("Fail tidak ditemui.");
  const { data, error } = await supabase.storage
    .from("event-docs")
    .createSignedUrl(document.storagePath, 300);
  if (error) throw error;
  return Linking.openURL(data.signedUrl);
}

/** Hands the file to the system share sheet so the user can save it to Files, Drive or another app. */
export async function saveEventDocument(document: EventDocument) {
  if (Platform.OS === "web") return openEventDocument(document);
  let uri = document.localUri;
  if (!uri) {
    if (!document.storagePath) throw new Error("Fail tidak ditemui.");
    const { data, error } = await supabase.storage.from("event-docs").createSignedUrl(document.storagePath, 300);
    if (error) throw error;
    const target = new File(Paths.cache, safeName(document.name));
    if (target.exists) target.delete();
    uri = (await File.downloadFileAsync(data.signedUrl, target)).uri;
  }
  await Sharing.shareAsync(uri, { mimeType: document.mimeType, dialogTitle: document.name });
}

export async function deleteEventDocumentFile(document: EventDocument) {
  if (!document.storagePath) return;
  const { error } = await supabase.storage
    .from("event-docs")
    .remove([document.storagePath]);
  if (error) throw error;
}
