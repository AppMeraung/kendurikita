import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Linking, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { validPortfolioVideo } from "../../domain/vendorMedia";
import { vendorCanAdd, vendorFeature } from "../../domain/entitlements";
import {
  addPortfolioVideo,
  deletePortfolioItem,
  loadPortfolio,
  replyToReview,
  uploadPortfolioImage,
  reviewPhotoUrls,
} from "../../services/vendorMedia";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";
import { useVendorPlan } from "../../state/usePlan";

type PortfolioItem = {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  caption?: string;
  event_name?: string;
};
type Review = {
  id: string;
  rating: number;
  body?: string;
  reply?: string;
  verified: boolean;
  photo_paths?: string[];
};

export default function VendorPortfolio() {
  const { t } = useTranslation();
  const { plan } = useVendorPlan();
  const [vendorId, setVendorId] = useState("");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [caption, setCaption] = useState("");
  const [eventName, setEventName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const load = async () => {
    try {
      const result = await loadPortfolio();
      setVendorId(result.vendorId);
      setItems(result.items as PortfolioItem[]);
      setReviews(result.reviews as Review[]);
    } catch (error) {
      Alert.alert(
        t("portfolioLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const addImage = async () => {
    if (
      !vendorCanAdd(
        plan,
        "photos",
        items.filter((item) => item.media_type === "image").length,
      )
    )
      return Alert.alert(t("vendorPhotoLimitReached"));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled) return;
    const image = result.assets[0];
    if (image.fileSize && image.fileSize > 10 * 1024 * 1024)
      return Alert.alert(t("portfolioImageTooLarge"));
    try {
      await uploadPortfolioImage(
        vendorId,
        {
          uri: image.uri,
          name: image.fileName || `portfolio-${Date.now()}.jpg`,
          mimeType: image.mimeType,
        },
        caption,
        eventName,
      );
      setCaption("");
      setEventName("");
      await load();
    } catch (error) {
      Alert.alert(
        t("portfolioSaveFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const addVideo = async () => {
    if (!vendorFeature(plan, "video"))
      return Alert.alert(t("premiumFeatureRequired"));
    if (!validPortfolioVideo(videoUrl))
      return Alert.alert(t("portfolioVideoInvalid"));
    try {
      await addPortfolioVideo(vendorId, videoUrl, caption, eventName);
      setCaption("");
      setEventName("");
      setVideoUrl("");
      await load();
    } catch (error) {
      Alert.alert(
        t("portfolioSaveFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const saveReply = async (id: string) => {
    try {
      await replyToReview(id, replies[id] || "");
      await load();
    } catch (error) {
      Alert.alert(
        t("reviewReplyFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("vendorPortfolio")}</Title>
      <Field
        value={eventName}
        onChangeText={setEventName}
        placeholder={t("portfolioEventName")}
      />
      <Field
        value={caption}
        onChangeText={setCaption}
        placeholder={t("portfolioCaption")}
      />
      <Button label={t("portfolioAddImage")} onPress={() => void addImage()} />
      <Field
        value={videoUrl}
        onChangeText={setVideoUrl}
        placeholder={t("portfolioVideoUrl")}
        autoCapitalize="none"
      />
      <Button
        label={t("portfolioAddVideo")}
        onPress={() => void addVideo()}
        secondary
      />
      {items.map((item) => (
        <Card key={item.id}>
          {item.event_name ? <Text style={styles.label}>{item.event_name}</Text> : null}
          {item.media_type === "image" ? (
            <Image
              source={{ uri: item.media_url }}
              style={{ width: "100%", height: 220, borderRadius: 12 }}
              contentFit="cover"
            />
          ) : (
            <Button
              label={t("portfolioOpenVideo")}
              onPress={() => void Linking.openURL(item.media_url)}
              secondary
            />
          )}
          {item.caption ? (
            <Text style={styles.muted}>{item.caption}</Text>
          ) : null}
          <Button
            label={t("delete")}
            onPress={() =>
              void deletePortfolioItem(item.id)
                .then(load)
                .catch((error) =>
                  Alert.alert(t("portfolioSaveFailed"), error.message),
                )
            }
            secondary
          />
        </Card>
      ))}
      <Title>{t("vendorReviews")}</Title>
      {reviews.length ? (
        reviews.map((review) => (
          <Card key={review.id}>
            <Text style={styles.label}>
              {"★".repeat(review.rating)} ·{" "}
              {review.verified ? t("reviewVerified") : t("reviewPending")}
            </Text>
            <Text style={styles.muted}>{review.body}</Text>
            {reviewPhotoUrls(review.photo_paths).map((url) => <Image key={url} source={{ uri: url }} style={{ width: "100%", height: 180, borderRadius: 12 }} contentFit="cover" />)}
            <Field
              value={replies[review.id] ?? review.reply ?? ""}
              onChangeText={(value) =>
                setReplies((current) => ({ ...current, [review.id]: value }))
              }
              placeholder={t("reviewReply")}
              multiline
            />
            <Button
              label={t("saveReply")}
              onPress={() => void saveReply(review.id)}
              secondary
            />
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.muted}>{t("reviewsEmpty")}</Text>
        </Card>
      )}
    </Screen>
  );
}
