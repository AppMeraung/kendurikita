import * as Linking from "expo-linking";
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

export async function deleteEventDocumentFile(document: EventDocument) {
  if (!document.storagePath) return;
  const { error } = await supabase.storage
    .from("event-docs")
    .remove([document.storagePath]);
  if (error) throw error;
}
