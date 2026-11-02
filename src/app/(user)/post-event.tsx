import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { whatsappUrl } from "../../domain/invitation";
import { userFeature } from "../../domain/entitlements";
import {
  GalleryPhoto,
  GuestWish,
  loadPostEvent,
} from "../../services/postEvent";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Button, Card, Field, palette, Screen, styles, Title } from "../../ui";

export default function PostEvent() {
  const { t } = useTranslation();
  const { event, updateEvent } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [wishes, setWishes] = useState<GuestWish[]>([]);
  const [loading, setLoading] = useState(Boolean(event?.cloudId));
  useEffect(() => {
    if (!event?.cloudId || !userFeature(plan, "gallery")) return;
    void loadPostEvent(event.cloudId)
      .then((data) => {
        setGallery(data.gallery);
        setWishes(data.wishes);
      })
      .catch((error) => Alert.alert(t("postEventLoadFailed"), error.message))
      .finally(() => setLoading(false));
  }, [event?.cloudId, plan, t]);
  if (!event) return null;
  const shareThanks = async (phone?: string, name?: string) => {
    const text = `${event.thankYouMessage || t("thankYouDefault")}\n\n${name || ""}`;
    await Linking.openURL(whatsappUrl(phone, text));
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("postEventTitle")}</Title>
      <Card>
        <Text style={styles.label}>{t("thankYouTemplate")}</Text>
        <Field
          value={event.thankYouMessage}
          onChangeText={(thankYouMessage) => updateEvent({ thankYouMessage })}
          placeholder={t("thankYouDefault")}
          multiline
        />
        {event.guests.map((guest) => (
          <Button
            key={guest.id}
            label={t("thankGuest", { name: guest.name })}
            onPress={() => void shareThanks(guest.phone, guest.name)}
            secondary
          />
        ))}
      </Card>
      <Title>{t("guestGallery")}</Title>
      {!userFeature(plan, "gallery") ? (
        <Card>
          <Text style={styles.muted}>{t("premiumFeatureRequired")}</Text>
          <Button
            label={t("viewPackages")}
            onPress={() => router.push("/(user)/paywall")}
          />
        </Card>
      ) : loading ? (
        <Text style={styles.muted}>{t("loading")}</Text>
      ) : gallery.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {gallery.map((photo) => (
            <View key={photo.id} style={{ width: "48%" }}>
              <Image
                source={photo.url}
                style={{ width: "100%", height: 150, borderRadius: 12 }}
                contentFit="cover"
              />
              <Text style={styles.muted}>{photo.guestName || t("guest")}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.muted}>
          {event.cloudId ? t("galleryEmpty") : t("syncForGallery")}
        </Text>
      )}
      <Title>{t("wishesArchive")}</Title>
      {wishes.length ? (
        wishes.map((wish) => (
          <Card key={wish.id}>
            <Text style={styles.label}>{wish.guestName}</Text>
            <Text style={styles.muted}>{wish.message}</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.muted}>{t("wishesEmpty")}</Text>
      )}
    </Screen>
  );
}
