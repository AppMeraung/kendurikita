import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { EventDocument } from "../../domain";
import { validEventDocument } from "../../domain/documents";
import { userLimits } from "../../domain/entitlements";
import {
  deleteEventDocumentFile,
  openEventDocument,
  saveEventDocument,
} from "../../services/documents";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Button, Card, Empty, ListPicker, palette, Screen, styles, Title } from "../../ui";

const folders: EventDocument["folder"][] = [
  "contracts",
  "receipts",
  "identity",
  "other",
];

export default function Documents() {
  const { t } = useTranslation();
  const { event, addDocument, deleteDocument } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const [folder, setFolder] = useState<EventDocument["folder"]>("contracts");
  const [filter, setFilter] = useState<EventDocument["folder"] | "all">("all");
  if (!event) return null;
  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!validEventDocument(asset.mimeType || undefined, asset.size))
      return Alert.alert(t("documentInvalid"));
    const used = event.documents.reduce(
      (sum, document) => sum + (document.size || 0),
      0,
    );
    if (used + (asset.size || 0) > userLimits[plan].storageMb * 1024 * 1024)
      return Alert.alert(t("storageLimitReached"));
    addDocument({
      name: asset.name,
      folder,
      localUri: asset.uri,
      mimeType: asset.mimeType || undefined,
      size: asset.size,
    });
  };
  const open = async (document: EventDocument) => {
    try {
      await openEventDocument(document);
    } catch (error) {
      Alert.alert(
        t("documentOpenFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const save = async (document: EventDocument) => {
    try {
      await saveEventDocument(document);
    } catch (error) {
      Alert.alert(t("documentOpenFailed"), error instanceof Error ? error.message : t("unknownError"));
    }
  };
  const shown = event.documents.filter((document) => filter === "all" || document.folder === filter);
  const remove = (document: EventDocument) =>
    Alert.alert(t("deleteConfirm"), "", [
      { text: t("cancel") },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () =>
          void deleteEventDocumentFile(document)
            .then(() => deleteDocument(document.id))
            .catch((error) =>
              Alert.alert(t("documentDeleteFailed"), error.message),
            ),
      },
    ]);
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("documentsTitle")}</Title>
      {event.documents.length ? <ListPicker icon="filter-outline" label={t("documentsShow")} value={filter} options={[["all", `${t("all")} (${event.documents.length})`] as const, ...folders.map((value) => [value, `${t(`documentFolder_${value}`)} (${event.documents.filter((document) => document.folder === value).length})`] as const)]} onChange={setFilter} /> : null}
      {!event.documents.length ? (
        <Empty icon="📄" text={t("documentsEmpty")} action={t("documentAdd")} onPress={() => void pick()} />
      ) : (
        <Card>
          {shown.map((document, index) => (
            <View key={document.id} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12 }]}>
              <Ionicons name={document.mimeType?.startsWith("image/") ? "image-outline" : "document-text-outline"} size={24} color={palette.maroon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { fontWeight: "600" }]} numberOfLines={1}>{document.name}</Text>
                <Text style={[styles.muted, { fontSize: 12 }]}>
                  {t(`documentFolder_${document.folder}`)}
                  {document.size ? ` · ${Math.ceil(document.size / 1024)} KB` : ""}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`${t("documentView")} ${document.name}`} onPress={() => void open(document)} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="eye-outline" size={22} color={palette.maroon} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`${t("documentSave")} ${document.name}`} onPress={() => void save(document)} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="download-outline" size={22} color={palette.maroon} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`${t("delete")} ${document.name}`} onPress={() => remove(document)} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={20} color={palette.danger} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}
      <ListPicker icon="folder-outline" label={t("documentFolder")} value={folder} options={folders.map((value) => [value, t(`documentFolder_${value}`)] as const)} onChange={setFolder} />
      <Button icon="cloud-upload-outline" label={t("documentAdd")} onPress={() => void pick()} />
    </Screen>
  );
}
