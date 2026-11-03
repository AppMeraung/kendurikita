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
import { FloralCorner, Ornament } from "../../components/Floral";
import { Button, Card, Chip, Field, palette, Screen, serif, Stat, StatusPill, styles, Title } from "../../ui";

const templateLooks: Record<InvitationSettings["template"], { bg: string; ink: string }> = {
  malay: { bg: "#71162F", ink: "#F5D891" },
  chinese: { bg: "#FFF3E6", ink: "#A11D2B" },
  indian: { bg: "#F2D9D2", ink: "#71162F" },
  indonesian: { bg: "#FFF9EC", ink: "#8A5A1E" },
  modern: { bg: "#FFFDF8", ink: "#3A2228" },
};
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
      <Title subtitle={t("inviteIntro")}>{t("inviteTitle")}</Title>
      <Card>
        <View style={styles.row}>
          <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" }}><Ionicons name="mail-open-outline" size={26} color={palette.maroon} /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.label}>{t("yourInvitation")}</Text>
            <StatusPill label={published.length || event.cloudId ? t("invitationActive") : t("invitationDraft")} tone={published.length || event.cloudId ? "success" : "neutral"} />
          </View>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Stat icon="checkmark-circle-outline" tone="success" value={event.guests.filter((g) => g.rsvp === "Hadir").length} label={t("attending")} />
          <Stat icon="help-circle-outline" tone="warning" value={event.guests.filter((g) => g.rsvp === "Menunggu").length} label={t("pending")} />
          <Stat icon="close-circle-outline" tone="danger" value={event.guests.filter((g) => g.rsvp === "Tidak hadir").length} label={t("notAttending")} />
        </View>
      </Card>
      <Text style={styles.label}>{t("inviteTemplate")}</Text>
      <View style={styles.grid}>
        {templates.map((template, index) => {
          const locked = index >= 3 && !planAllows(plan, "pro");
          const active = settings.template === template;
          const look = templateLooks[template];
          return (
            <Pressable
              key={template}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(`inviteTemplate_${template}`)}
              onPress={() => (locked ? Alert.alert(t("proFeatureRequired")) : change({ template }))}
              style={{ flexBasis: "47%", flexGrow: 1, gap: 6 }}
            >
              <View style={{ aspectRatio: 0.85, borderRadius: 14, backgroundColor: look.bg, borderWidth: active ? 2 : 1, borderColor: active ? palette.gold : palette.line, alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden" }}>
                <View style={{ position: "absolute", top: -8, left: -8, opacity: 0.85 }}><FloralCorner size={64} /></View>
                <View style={{ position: "absolute", bottom: -8, right: -8, opacity: 0.85, transform: [{ rotate: "180deg" }] }}><FloralCorner size={64} /></View>
                <Text style={{ fontFamily: serif, fontStyle: "italic", fontSize: 20, color: look.ink, textAlign: "center", paddingHorizontal: 12 }} numberOfLines={2}>{event.name}</Text>
                <Ornament width={56} />
                {active ? <View style={{ position: "absolute", top: 8, right: 8 }}><Ionicons name="checkmark-circle" size={22} color={palette.gold} /></View> : null}
                {locked ? <View style={{ position: "absolute", top: 8, right: 8 }}><Ionicons name="lock-closed" size={18} color={look.ink} /></View> : null}
              </View>
              <Text style={[styles.label, { textAlign: "center", fontWeight: "600" }]}>{t(`inviteTemplate_${template}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>{t("language")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {languages.map((language) => (
          <Chip key={language} label={languageNames[language]} active={settings.language === language} onPress={() => change({ language })} />
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
        icon="share-social-outline"
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
