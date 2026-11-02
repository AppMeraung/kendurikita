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
} from "../../services/documents";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Button, Card, Empty, palette, Screen, styles, Title } from "../../ui";

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
      <Text style={styles.label}>{t("documentFolder")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {folders.map((value) => (
          <Button
            key={value}
            label={t(`documentFolder_${value}`)}
            onPress={() => setFolder(value)}
            secondary={folder !== value}
          />
        ))}
      </View>
      {!event.documents.length ? (
        <Empty
          icon="📄"
          text={t("documentsEmpty")}
          action={t("documentAdd")}
          onPress={() => void pick()}
        />
      ) : (
        event.documents.map((document) => (
          <Card key={document.id}>
            <View style={styles.between}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => void open(document)}
              >
                <Text style={styles.label}>{document.name}</Text>
                <Text style={styles.muted}>
                  {t(`documentFolder_${document.folder}`)}
                  {document.size
                    ? ` · ${Math.ceil(document.size / 1024)} KB`
                    : ""}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={t("delete")}
                onPress={() => remove(document)}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={palette.danger}
                />
              </Pressable>
            </View>
          </Card>
        ))
      )}
      <Button label={t("documentAdd")} onPress={() => void pick()} />
    </Screen>
  );
}
