import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Modal, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { validReview } from "../../domain/vendorMedia";
import { createVendorReview } from "../../services/vendorMedia";
import { recordVendorViews } from "../../services/vendorAnalytics";
import { cloudConfigured, supabase } from "../../services/supabase";
import { useAppState } from "../../state/AppState";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";
import { ReportTarget, submitReport } from "../../services/safety";

type Vendor = {
  id: string;
  company_name: string;
  description: Record<string, string>;
  phone: string | null;
  coverage: string[];
  policies: Record<string, string | number>;
  badges: string[];
  logo_url?: string;
  cover_url?: string;
};
type PortfolioItem = {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  caption?: string;
};
type Package = {
  id: string;
  name: string;
  price: number;
  price_type: string;
  inclusions: string[];
  minimum_pax?: number;
};
type Review = {
  id: string;
  rating: number;
  body?: string;
  reply?: string;
};

export default function VendorProfile() {
  const { slug = "" } = useLocalSearchParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { event } = useAppState();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reportTarget, setReportTarget] = useState<{ type: ReportTarget; id: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const load = async () => {
    if (!cloudConfigured) return;
    const profile = await supabase
      .from("vendors")
      .select(
        "id,company_name,description,phone,coverage,policies,badges,logo_url,cover_url",
      )
      .eq("slug", slug)
      .eq("verification_status", "approved")
      .maybeSingle();
    if (profile.error || !profile.data) {
      setVendor(null);
      return;
    }
    setVendor(profile.data as Vendor);
    const [media, offers, feedback, dates] = await Promise.all([
      supabase
        .from("vendor_portfolio")
        .select("id,media_url,media_type,caption")
        .eq("vendor_id", profile.data.id)
        .eq("moderation_status", "approved")
        .order("sort_order"),
      supabase
        .from("vendor_packages")
        .select("id,name,price,price_type,inclusions,minimum_pax")
        .eq("vendor_id", profile.data.id)
        .eq("active", true),
      supabase
        .from("vendor_reviews")
        .select("id,rating,body,reply")
        .eq("vendor_id", profile.data.id)
        .eq("verified", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("vendor_availability")
        .select("starts_at,status")
        .eq("vendor_id", profile.data.id)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at")
        .limit(6),
    ]);
    if (!media.error) setPortfolio((media.data || []) as PortfolioItem[]);
    if (!offers.error) {
      setPackages((offers.data || []) as Package[]);
      void recordVendorViews(profile.data.id, (offers.data || []).map((item) => item.id)).catch(() => undefined);
    }
    if (!feedback.error) setReviews((feedback.data || []) as Review[]);
    if (!dates.error)
      setAvailability(
        (dates.data || []).map(
          (item) =>
            `${String(item.starts_at).slice(0, 10)} · ${t(
              `availabilityStatus_${item.status}`,
            )}`,
        ),
      );
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  const submitReview = async () => {
    if (!vendor || !event?.cloudId) return Alert.alert(t("reviewNeedsBooking"));
    if (!validReview(rating, reviewBody))
      return Alert.alert(t("reviewInvalid"));
    try {
      await createVendorReview(vendor.id, event.cloudId, rating, reviewBody);
      setReviewBody("");
      Alert.alert(t("reviewSubmitted"));
      await load();
    } catch (error) {
      Alert.alert(
        t("reviewSubmitFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const report = async () => {
    if (!reportTarget || reportReason.trim().length < 3) return Alert.alert(t("reportReasonRequired"));
    try {
      await submitReport(reportTarget.type, reportTarget.id, reportReason, reportDetails);
      setReportTarget(null); setReportReason(""); setReportDetails("");
      Alert.alert(t("reportSubmitted"));
    } catch (error) {
      Alert.alert(t("reportFailed"), error instanceof Error ? error.message : t("unknownError"));
    }
  };
  if (!vendor)
    return (
      <Screen>
        <Title>{t("vendorUnavailable")}</Title>
        <Card>
          <Text style={styles.muted}>{t("vendorUnavailableDetail")}</Text>
        </Card>
      </Screen>
    );
  const language = i18n.language.split("-")[0];
  const description =
    vendor.description?.[language] ||
    vendor.description?.ms ||
    vendor.description?.en ||
    "";
  return (
    <Screen>
      {vendor.cover_url ? (
        <Image
          source={{ uri: vendor.cover_url }}
          style={{ width: "100%", height: 220, borderRadius: 18 }}
          contentFit="cover"
        />
      ) : null}
      <Title>{vendor.company_name}</Title>
      <Card>
        <Text style={styles.label}>✓ {t("reviewVerified")}</Text>
        {vendor.badges?.length ? (
          <Text style={styles.muted}>{vendor.badges.join(" · ")}</Text>
        ) : null}
        <Text style={styles.muted}>{description}</Text>
        <Text style={styles.muted}>{vendor.coverage?.join(", ")}</Text>
        {vendor.phone ? (
          <Button
            label={t("contactVendor")}
            onPress={() => void Linking.openURL(`tel:${vendor.phone}`)}
            secondary
          />
        ) : null}
        <Button label={t("reportVendor")} onPress={() => setReportTarget({ type: "vendor", id: vendor.id })} secondary />
      </Card>
      <Title>{t("vendorPortfolio")}</Title>
      {portfolio.map((item) => (
        <Card key={item.id}>
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
          <Button label={t("reportPortfolio")} onPress={() => setReportTarget({ type: "portfolio", id: item.id })} secondary />
        </Card>
      ))}
      <Title>{t("vendorPackages")}</Title>
      {packages.map((item) => (
        <Card key={item.id}>
          <Text style={styles.label}>
            {item.name} · RM {Number(item.price).toFixed(2)}
          </Text>
          <Text style={styles.muted}>{item.inclusions?.join(" · ")}</Text>
          {item.minimum_pax ? (
            <Text style={styles.muted}>
              {t("minimumPax")}: {item.minimum_pax}
            </Text>
          ) : null}
        </Card>
      ))}
      {availability.length ? (
        <>
          <Title>{t("vendorCalendar")}</Title>
          <Card>
            {availability.map((item) => (
              <Text key={item} style={styles.muted}>
                {item}
              </Text>
            ))}
          </Card>
        </>
      ) : null}
      <Title>{t("vendorReviews")}</Title>
      {reviews.map((review) => (
        <Card key={review.id}>
          <Text style={styles.label}>{"★".repeat(review.rating)}</Text>
          <Text style={styles.muted}>{review.body}</Text>
          {review.reply ? (
            <Text style={styles.muted}>
              {t("vendorReply")}: {review.reply}
            </Text>
          ) : null}
          <Button label={t("reportReview")} onPress={() => setReportTarget({ type: "review", id: review.id })} secondary />
        </Card>
      ))}
      <Card>
        <Text style={styles.label}>{t("writeReview")}</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              label={String(value)}
              onPress={() => setRating(value)}
              secondary={rating !== value}
            />
          ))}
        </View>
        <Field
          value={reviewBody}
          onChangeText={setReviewBody}
          placeholder={t("reviewBody")}
          multiline
        />
        <Button label={t("submitReview")} onPress={() => void submitReview()} />
      </Card>
      <Modal visible={!!reportTarget} animationType="slide" onRequestClose={() => setReportTarget(null)}>
        <Screen>
          <Title>{t(reportTarget?.type === "review" ? "reportReview" : reportTarget?.type === "portfolio" ? "reportPortfolio" : "reportVendor")}</Title>
          <Field value={reportReason} onChangeText={setReportReason} placeholder={t("reportReason")} />
          <Field value={reportDetails} onChangeText={setReportDetails} placeholder={t("reportDetails")} multiline />
          <Button label={t("submitReport")} onPress={() => void report()} />
          <Button label={t("cancel")} onPress={() => setReportTarget(null)} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
