import { useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Image, Text } from "react-native";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { validRsvpPax, validRsvpToken } from "../../domain/rsvp";
import i18n, { Language, languages } from "../../i18n";
import { cloudConfigured, supabase } from "../../services/supabase";
import { uploadGuestPhoto } from "../../services/postEvent";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

type PublicGuest = {
  id: string;
  name: string;
  pax: number;
  eventName: string;
  eventDate?: string;
  venue: string;
  content?: {
    message?: string;
    photo_url?: string;
    gift_link?: string;
    duitnow_qr_url?: string;
    watermark?: boolean;
  };
  galleryEnabled?: boolean;
  guestbookEnabled?: boolean;
};

function daysUntil(eventDate: string | undefined, now: number) {
  if (!eventDate) return null;
  const eventTime = new Date(`${eventDate}T00:00:00`).getTime();
  if (!Number.isFinite(eventTime)) return null;
  return Math.max(0, Math.ceil((eventTime - now) / 86_400_000));
}

export default function PublicRsvp() {
  const { token = "" } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const canLoad = validRsvpToken(token) && cloudConfigured;
  const [guest, setGuest] = useState<PublicGuest | null>(null);
  const [pax, setPax] = useState("1");
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(canLoad);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadedAt] = useState(Date.now);
  const countdown = daysUntil(guest?.eventDate, loadedAt);

  useEffect(() => {
    if (!canLoad) return;
    void supabase.rpc("get_public_invitation", { token }).then(({ data }) => {
      const row = data?.[0];
      const language = row?.invitation_language as Language | undefined;
      if (language && languages.includes(language))
        void i18n.changeLanguage(language);
      const next = row
        ? {
            id: row.guest_id,
            name: row.guest_name,
            pax: row.invited_pax,
            eventName: row.event_name,
            eventDate: row.event_date || undefined,
            venue: row.venue,
            content: row.invitation_content || undefined,
            galleryEnabled: !!row.gallery_enabled,
            guestbookEnabled: !!row.guestbook_enabled,
          }
        : null;
      setGuest(next);
      if (next) setPax(`${next.pax}`);
      setLoading(false);
    });
  }, [canLoad, token]);

  const submit = async (attending: boolean) => {
    if (!guest || !validRsvpPax(pax, guest.pax)) {
      Alert.alert(t("rsvpInvalidPax", { max: guest?.pax ?? 1 }));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_public_rsvp", {
      token,
      is_attending: attending,
      response_pax: Number(pax),
      dietary_note: dietary.trim() || null,
      guest_message: message.trim() || null,
    });
    setSubmitting(false);
    Alert.alert(
      error ? t("rsvpFailed") : t("rsvpThanks"),
      error ? error.message : t("rsvpRecorded"),
    );
  };
  const uploadPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      await uploadGuestPhoto(
        token,
        result.assets[0].uri,
        result.assets[0].mimeType,
      );
      Alert.alert(t("guestPhotoUploaded"));
    } catch (error) {
      Alert.alert(
        t("guestPhotoFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <Title>{t("rsvpTitle")}</Title>
      {loading ? (
        <Text style={styles.muted}>{t("loading")}</Text>
      ) : !guest ? (
        <Card>
          <Text style={styles.label}>{t("rsvpInvalidLink")}</Text>
        </Card>
      ) : (
        <Card>
          {guest.content?.photo_url ? (
            <Image
              source={{ uri: guest.content.photo_url }}
              style={{ width: "100%", height: 220, borderRadius: 16 }}
            />
          ) : null}
          <Text style={styles.label}>{guest.eventName}</Text>
          {guest.content?.watermark ? (
            <Text style={styles.muted}>KenduriKita</Text>
          ) : null}
          {guest.content?.message ? (
            <Text style={styles.muted}>{guest.content.message}</Text>
          ) : null}
          <Text style={styles.muted}>{guest.name}</Text>
          {guest.eventDate ? (
            <Text style={styles.muted}>{guest.eventDate}</Text>
          ) : null}
          {countdown !== null ? (
            <Text style={styles.label}>{t("invitationCountdown", { count: countdown })}</Text>
          ) : null}
          <Card>
            <Text style={styles.label}>{t("guestCheckInQr")}</Text>
            <Text style={styles.muted}>{t("guestCheckInQrHint")}</Text>
            <QRCode value={token} size={200} />
          </Card>
          {guest.venue ? <Text style={styles.muted}>{guest.venue}</Text> : null}
          <Field
            value={pax}
            onChangeText={setPax}
            keyboardType="numeric"
            placeholder={t("rsvpPax", { max: guest.pax })}
          />
          <Field
            value={dietary}
            onChangeText={setDietary}
            placeholder={t("rsvpDietary")}
          />
          {guest.guestbookEnabled ? <Field value={message} onChangeText={setMessage} placeholder={t("rsvpMessage")} multiline /> : null}
          {guest.venue ? (
            <>
              <Button
                label={t("openMaps")}
                onPress={() =>
                  void Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(guest.venue)}`,
                  )
                }
                secondary
              />
              <Button
                label={t("openWaze")}
                onPress={() =>
                  void Linking.openURL(
                    `https://www.waze.com/ul?q=${encodeURIComponent(guest.venue)}&navigate=yes`,
                  )
                }
                secondary
              />
            </>
          ) : null}
          {guest.eventDate ? (
            <Button
              label={t("addToCalendar")}
              onPress={() => {
                const date = guest.eventDate!.replaceAll("-", "");
                const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(guest.eventName)}&dates=${date}/${date}&location=${encodeURIComponent(guest.venue)}`;
                void Linking.openURL(calendarUrl);
              }}
              secondary
            />
          ) : null}
          {guest.content?.gift_link ? (
            <Button
              label={t("openGiftLink")}
              onPress={() => void Linking.openURL(guest.content!.gift_link!)}
              secondary
            />
          ) : null}
          {guest.content?.duitnow_qr_url ? <Card><Text style={styles.label}>{t("duitNowGift")}</Text><Image source={{ uri: guest.content.duitnow_qr_url }} style={{ width: 220, height: 220, alignSelf: "center", borderRadius: 12 }} /></Card> : null}
          <Button
            label={t("rsvpAttend")}
            onPress={() => void submit(true)}
            disabled={submitting}
          />
          <Button
            label={t("rsvpDecline")}
            onPress={() => void submit(false)}
            secondary
            disabled={submitting}
          />
          {guest.galleryEnabled ? (
            <Button
              label={t("guestPhotoUpload")}
              onPress={() => void uploadPhoto()}
              secondary
              disabled={uploading}
            />
          ) : null}
        </Card>
      )}
    </Screen>
  );
}
