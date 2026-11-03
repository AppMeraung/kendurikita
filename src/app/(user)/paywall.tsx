import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { UserPlan, userLimits } from "../../domain/entitlements";
import { useAppState } from "../../state/AppState";
import { currentOffering, customerInfo, purchasePackage, purchasesConfigured, restorePurchases, setPurchaseContext, subscriptionManagementUrl } from "../../services/revenuecat";
import { Button, Card, palette, Screen, styles, Title } from "../../ui";

type Pack = { identifier: string; product: { title: string; description: string; priceString: string } };
type Status = { names: string[]; expiry?: string };
const planFeatures: Record<UserPlan, string[]> = {
  basic: ["planCoreTools", "planBasicGuests", "planBasicMember", "planBasicStorage"],
  pro: ["planCoreTools", "planProGuests", "planProMembers", "planProStorage", "planProFeatures"],
  premium: ["planPremiumEvents", "planUnlimitedGuests", "planUnlimitedMembers", "planPremiumStorage", "planPremiumFeatures"],
};

export default function Paywall() {
  const { t } = useTranslation();
  const { event } = useAppState();
  const [packages, setPackages] = useState<Pack[]>([]);
  const [status, setStatus] = useState<Status>({ names: [] });
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (!purchasesConfigured) return;
    await setPurchaseContext({ eventId: event?.cloudId });
    const [offering, info] = await Promise.all([currentOffering(), customerInfo()]);
    setPackages((offering?.availablePackages || []) as Pack[]);
    const active = Object.values(info?.entitlements.active || {});
    setStatus({
      names: active.map((item) => item.identifier),
      expiry: active.map((item) => item.expirationDate).filter((value): value is string => Boolean(value)).sort().at(-1),
    });
  }, [event?.cloudId]);
  useEffect(() => {
    void Promise.resolve().then(refresh).catch(() => undefined);
  }, [refresh]);
  const buy = async (id: string) => {
    setBusy(true);
    try {
      await purchasePackage(id);
      await refresh();
      Alert.alert(t("purchaseSuccessful"), t("entitlementSynced"));
    } catch (error) {
      Alert.alert(t("purchaseIncomplete"), error instanceof Error ? error.message : t("genericError"));
    } finally { setBusy(false); }
  };
  const restore = async () => {
    setBusy(true);
    try {
      await restorePurchases();
      await refresh();
      Alert.alert(t("purchasesRestored"));
    } catch (error) {
      Alert.alert(t("restoreFailed"), error instanceof Error ? error.message : t("genericError"));
    } finally { setBusy(false); }
  };
  const packageFor = (plan: "pro" | "premium") => packages.find((item) => item.identifier.toLowerCase().includes(plan));
  const planCard = (plan: UserPlan) => {
    const item = plan === "basic" ? undefined : packageFor(plan);
    const highlighted = plan === "pro";
    const limits = userLimits[plan];
    return <View key={plan} style={{ borderWidth: highlighted ? 2 : 1, borderColor: highlighted ? palette.gold : palette.line, backgroundColor: palette.white, borderRadius: 22, padding: 18, gap: 12 }}>
      <View style={styles.between}>
        <View><Text style={{ color: palette.maroon, fontSize: 22, fontWeight: "900" }}>{t(`planName_${plan}`)}</Text><Text style={styles.muted}>{plan === "basic" ? t("freeForever") : item?.product.priceString || t("priceAtCheckout")}</Text></View>
        {highlighted ? <View style={{ backgroundColor: palette.gold, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ color: palette.white, fontWeight: "900" }}>{t("mostPopular")}</Text></View> : null}
      </View>
      <Text style={styles.muted}>{t(`planSummary_${plan}`)}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Text style={{ color: palette.ink, backgroundColor: palette.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, fontWeight: "700" }}>{Number.isFinite(limits.events) ? limits.events : "∞"} {t("planEvents")}</Text>
        <Text style={{ color: palette.ink, backgroundColor: palette.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, fontWeight: "700" }}>{Number.isFinite(limits.guests) ? limits.guests : "∞"} {t("planGuests")}</Text>
        <Text style={{ color: palette.ink, backgroundColor: palette.cream, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, fontWeight: "700" }}>{Number.isFinite(limits.storageMb) && limits.storageMb >= 1024 ? `${limits.storageMb / 1024} GB` : `${limits.storageMb} MB`}</Text>
      </View>
      {planFeatures[plan].map((feature) => <View key={feature} style={styles.row}><Ionicons name="checkmark-circle" size={21} color={palette.maroon} /><Text style={[styles.muted, { flex: 1 }]}>{t(feature)}</Text></View>)}
      {plan === "basic" ? <View style={{ paddingVertical: 8 }}><Text style={[styles.label, { textAlign: "center" }]}>{t("currentFreePlan")}</Text></View> : <Button label={item ? t("choosePlan") : t("priceAtCheckout")} onPress={() => item ? void buy(item.identifier) : undefined} disabled={busy || !item} />}
    </View>;
  };
  return <Screen>
    <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}><Text style={styles.label}>‹ {t("back")}</Text></Pressable>
    <Title>{t("kenduriKitaPlans")}</Title>
    <Text style={styles.muted}>{t("comparePlansBody")}</Text>
    {status.names.length ? <Card>
      <Text style={styles.label}>{t("activeSubscription")}</Text>
      <Text style={styles.muted}>{status.names.join(", ")}</Text>
      {status.expiry ? <Text style={styles.muted}>{t("renewsOrExpires", { date: new Date(status.expiry).toLocaleDateString() })}</Text> : null}
      <Button label={t("manageSubscription")} onPress={() => void Linking.openURL(subscriptionManagementUrl())} secondary />
    </Card> : null}
    {(["basic", "pro", "premium"] as UserPlan[]).map(planCard)}
    {!purchasesConfigured ? <Card><Text style={styles.muted}>{t("revenueCatNotConfigured")}</Text></Card> : null}
    <Button label={t("restorePurchases")} onPress={() => void restore()} secondary disabled={busy} />
    <Text style={styles.muted}>{t("purchaseLegalPrefix")} <Text style={styles.label} onPress={() => router.push("/legal/terms")}>{t("terms")}</Text> {t("and")} <Text style={styles.label} onPress={() => router.push("/legal/privacy")}>{t("privacyPolicy")}</Text>. {t("purchaseRenewalNote")}</Text>
  </Screen>;
}
