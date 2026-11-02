import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { reviewPhotoUrls } from "../services/vendorMedia";
import {
  loadAdminDashboard,
  moderateReview,
  moderatePortfolio,
  moderateVendor,
  resolveReport,
  saveCategory,
  setVendorBadges,
  setCategoryActive,
  updateSubscription,
} from "../services/admin";
import { Button, Card, Field, Screen, styles, Title } from "../ui";

type Dashboard = Awaited<ReturnType<typeof loadAdminDashboard>>;
const availableBadges = ["popular", "fast_response", "halal", "premium"];

export default function AdminPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<Dashboard>();
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await loadAdminDashboard());
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("unknownError"),
      );
    }
  }, [t]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const run = async (action: () => Promise<void>) => {
    try {
      await action();
      await load();
    } catch (cause) {
      Alert.alert(
        t("actionFailed"),
        cause instanceof Error ? cause.message : t("unknownError"),
      );
    }
  };
  if (error)
    return (
      <Screen>
        <Title>{t("adminPanel")}</Title>
        <Card>
          <Text style={styles.danger}>{error}</Text>
        </Card>
      </Screen>
    );
  if (!data)
    return (
      <Screen>
        <Title>{t("adminPanel")}</Title>
        <Text style={styles.muted}>{t("loading")}</Text>
      </Screen>
    );
  return (
    <Screen>
      <Title>{t("adminPanel")}</Title>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Card>
          <Text style={styles.metric}>{data.userCount}</Text>
          <Text style={styles.muted}>{t("users")}</Text>
        </Card>
        <Card>
          <Text style={styles.metric}>{data.eventCount}</Text>
          <Text style={styles.muted}>{t("events")}</Text>
        </Card>
        <Card>
          <Text style={styles.metric}>{data.vendors.length}</Text>
          <Text style={styles.muted}>Vendor</Text>
        </Card>
        <Card>
          <Text style={styles.metric}>{data.confirmedBookingCount}</Text>
          <Text style={styles.muted}>{t("confirmedBookings")}</Text>
        </Card>
        <Card>
          <Text style={styles.metric}>{data.reports.filter((item) => item.status === "open").length}</Text>
          <Text style={styles.muted}>{t("openReports")}</Text>
        </Card>
      </View>
      <Title>{t("vendorApprovals")}</Title>
      <Field
        value={reason}
        onChangeText={setReason}
        placeholder={t("rejectionReason")}
      />
      {data.vendors.map((vendor) => (
        <Card key={vendor.id}>
          <Text style={styles.label}>{vendor.company_name}</Text>
          <Text style={styles.muted}>{vendor.verification_status}</Text>
          <Text style={styles.muted}>
            {t("badges")}: {(vendor.badges || []).join(", ") || "—"}
          </Text>
          <Button
            label={t("approve")}
            onPress={() =>
              void run(() => moderateVendor(vendor.id, "approved"))
            }
          />
          <Button
            label={t("reject")}
            onPress={() =>
              void run(() => moderateVendor(vendor.id, "rejected", reason))
            }
            secondary
          />
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {availableBadges.map((badge) => {
              const selected = (vendor.badges || []).includes(badge);
              return (
                <Button
                  key={badge}
                  label={badge}
                  secondary={!selected}
                  onPress={() =>
                    void run(() =>
                      setVendorBadges(
                        vendor.id,
                        selected
                          ? vendor.badges.filter(
                              (item: string) => item !== badge,
                            )
                          : [...(vendor.badges || []), badge],
                      ),
                    )
                  }
                />
              );
            })}
          </View>
        </Card>
      ))}
      <Title>{t("reviewModeration")}</Title>
      {data.reviews.map((review) => (
        <Card key={review.id}>
          <Text style={styles.label}>{"★".repeat(review.rating)}</Text>
          <Text style={styles.muted}>{review.body}</Text>
          {reviewPhotoUrls(review.photo_paths).map((url) => <Image key={url} source={{ uri: url }} style={{ width: "100%", height: 180, borderRadius: 12 }} contentFit="cover" />)}
          <Text style={styles.muted}>
            {review.verified ? t("published") : t("pending")}
          </Text>
          <Button
            label={review.verified ? t("hide") : t("publish")}
            onPress={() =>
              void run(() => moderateReview(review.id, !review.verified))
            }
            secondary
          />
        </Card>
      ))}
      <Title>{t("reports")}</Title>
      {data.reports.map((report) => (
        <Card key={report.id}>
          <Text style={styles.label}>
            {report.target_type} · {report.reason}
          </Text>
          <Text style={styles.muted}>{report.details}</Text>
          <Text style={styles.muted}>{report.status}</Text>
          {report.status === "open" ? (
            <>
              <Button
                label={t("resolve")}
                onPress={() =>
                  void run(() =>
                    resolveReport(report.id, "resolved", "Disemak oleh admin"),
                  )
                }
              />
              <Button
                label={t("dismissReport")}
                onPress={() =>
                  void run(() =>
                    resolveReport(report.id, "dismissed", t("noViolation")),
                  )
                }
                secondary
              />
            </>
          ) : null}
        </Card>
      ))}
      <Title>{t("portfolioModeration")}</Title>
      {data.portfolio.map((item) => (
        <Card key={item.id}>
          {item.media_type === "image" ? <Image source={{ uri: item.media_url }} style={{ width: "100%", height: 180, borderRadius: 12 }} contentFit="cover" /> : <Button label={t("portfolioOpenVideo")} onPress={() => void Linking.openURL(item.media_url)} secondary />}
          <Text style={styles.label}>{item.vendors?.[0]?.company_name || "Vendor"}</Text>
          <Text style={styles.muted}>{item.caption || "—"} · {item.moderation_status}</Text>
          <Button label={item.moderation_status === "approved" ? t("hide") : t("publish")} onPress={() => void run(() => moderatePortfolio(item.id, item.moderation_status !== "approved"))} secondary />
        </Card>
      ))}
      <Title>{t("categories")}</Title>
      {data.categories.map((category) => (
        <Card key={category.key}>
          <Text style={styles.label}>
            {String(category.label?.ms || category.label?.en || category.key)}
          </Text>
          <Text style={styles.muted}>
            {category.active ? t("active") : t("inactive")}
          </Text>
          <Button label={category.active ? t("deactivate") : t("activate")} onPress={() => void run(() => setCategoryActive(category.key, !category.active))} secondary />
        </Card>
      ))}
      <Field
        value={categoryKey}
        onChangeText={setCategoryKey}
        placeholder={t("categoryKey")}
      />
      <Field
        value={categoryLabel}
        onChangeText={setCategoryLabel}
        placeholder={t("categoryName")}
      />
      <Button
        label={t("saveCategory")}
        onPress={() =>
          void run(async () => {
            await saveCategory(categoryKey, categoryLabel);
            setCategoryKey("");
            setCategoryLabel("");
          })
        }
      />
      <Title>{t("subscriptions")}</Title>
      {data.subscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <Text style={styles.label}>
            {subscription.entitlement} · {subscription.status}
          </Text>
          <Text style={styles.muted}>{subscription.provider}</Text>
          <Text style={styles.muted}>
            {subscription.expires_at || t("noExpiry")}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(["active", "grace", "cancelled", "expired"] as const).map((status) => <Button key={status} label={t(`subscriptionStatus_${status}`)} onPress={() => void run(() => updateSubscription(subscription.id, status, subscription.expires_at || undefined))} secondary={subscription.status !== status} />)}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
