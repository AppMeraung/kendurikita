import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { InvitationSettings } from "../../domain";
import { planAllows } from "../../domain/plans";
import { invitationShareText, whatsappUrl } from "../../domain/invitation";
import { languages, languageNames } from "../../i18n";
import {
  GuestInvitation,
  publishInvitations,
} from "../../services/invitations";
import { syncEvent } from "../../services/sync";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Button, Card, Field, palette, Screen, styles, Title } from "../../ui";

const templates: InvitationSettings["template"][] = [
  "malay",
  "chinese",
  "indian",
  "indonesian",
  "modern",
];

export default function Invitation() {
  const { t } = useTranslation();
  const { event, updateEvent } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const [published, setPublished] = useState<GuestInvitation[]>([]);
  const [busy, setBusy] = useState(false);
  if (!event) return null;
  const settings = event.invitation;
  const change = (changes: Partial<InvitationSettings>) =>
    updateEvent({ invitation: { ...settings, ...changes } });
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert(t("photoPermission"));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) change({ photoUri: result.assets[0].uri });
  };
  const pickDuitNowQr = async () => {
    if (!planAllows(plan, "pro")) return Alert.alert(t("proFeatureRequired"));
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert(t("photoPermission"));
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (!result.canceled) change({ duitNowQrUri: result.assets[0].uri });
  };
  const publish = async () => {
    if (!event.guests.length) return Alert.alert(t("inviteNeedsGuests"));
    setBusy(true);
    try {
      const cloudId = await syncEvent(event);
      updateEvent({ cloudId });
      setPublished(await publishInvitations({ ...event, cloudId }, cloudId));
      Alert.alert(t("invitePublished"));
    } catch (error) {
      Alert.alert(
        t("invitePublishFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    } finally {
      setBusy(false);
    }
  };
  const share = async (item: GuestInvitation) => {
    const text = invitationShareText(
      settings.message || t("inviteDefaultMessage"),
      item.name,
      item.url,
    );
    await Linking.openURL(whatsappUrl(item.phone, text));
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("inviteTitle")}</Title>
      <Text style={styles.label}>{t("inviteTemplate")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {templates.map((template, index) => (
          <Button
            key={template}
            label={t(`inviteTemplate_${template}`)}
            onPress={() => {
              if (index >= 3 && !planAllows(plan, "pro"))
                return Alert.alert(t("proFeatureRequired"));
              change({ template });
            }}
            secondary={settings.template !== template}
          />
        ))}
      </View>
      <Text style={styles.label}>{t("language")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {languages.map((language) => (
          <Button
            key={language}
            label={languageNames[language]}
            onPress={() => change({ language })}
            secondary={settings.language !== language}
          />
        ))}
      </View>
      <Field
        value={settings.message}
        onChangeText={(message) => change({ message })}
        placeholder={t("inviteMessage")}
        multiline
      />
      {settings.duitNowQrUri ? <Image source={{ uri: settings.duitNowQrUri }} style={{ width: 180, height: 180, alignSelf: "center", borderRadius: 12 }} /> : null}
      <Button label={t("chooseDuitNowQr")} onPress={() => void pickDuitNowQr()} secondary />
      {planAllows(plan, "premium") ? (
        <Field
          value={settings.musicUrl || ""}
          onChangeText={(musicUrl) => change({ musicUrl })}
          placeholder={t("inviteMusic")}
        />
      ) : null}
      <Field
        value={settings.giftLink || ""}
        onChangeText={(giftLink) => change({ giftLink })}
        placeholder={t("inviteGift")}
      />
      <Field
        value={settings.wishlist || ""}
        onChangeText={(wishlist) => change({ wishlist })}
        placeholder={t("inviteWishlist")}
        multiline
      />
      {settings.photoUri ? (
        <Image
          source={{ uri: settings.photoUri }}
          style={{ width: "100%", height: 180, borderRadius: 16 }}
        />
      ) : null}
      <Button
        label={t("invitePhoto")}
        onPress={() =>
          planAllows(plan, "premium")
            ? void pickPhoto()
            : Alert.alert(t("premiumFeatureRequired"))
        }
        secondary
      />
      <Card>
        <Text style={styles.label}>{event.name}</Text>
        <Text style={styles.muted}>
          {settings.message || t("inviteDefaultMessage")}
        </Text>
        <Text style={styles.muted}>
          {event.date || ""} · {event.venue}
        </Text>
        {plan === "basic" ? (
          <Text style={styles.muted}>KenduriKita</Text>
        ) : null}
      </Card>
      <Button
        label={t("invitePublish")}
        onPress={() => void publish()}
        disabled={busy}
      />
      {published.map((item) => (
        <Card key={item.guestId}>
          <Text style={styles.label}>{item.name}</Text>
          <Text style={styles.muted}>{t("guestCheckInQr")}</Text>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <QRCode value={item.url} size={180} />
          </View>
          <Text style={styles.muted} numberOfLines={1}>
            {item.url}
          </Text>
          <Button
            label={t("inviteWhatsApp")}
            onPress={() => void share(item)}
            secondary
          />
        </Card>
      ))}
    </Screen>
  );
}
