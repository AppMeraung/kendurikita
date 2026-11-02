import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../state/AppState";
import { currentOffering, customerInfo, purchasePackage, purchasesConfigured, restorePurchases, setPurchaseContext, subscriptionManagementUrl } from "../../services/revenuecat";
import { Button, Card, Screen, styles, Title } from "../../ui";

type Pack = { identifier: string; product: { title: string; description: string; priceString: string } };
type Status = { names: string[]; expiry?: string };
const PRIVACY_URL = "https://appmeraung.github.io/kendurikita/index.html";
const TERMS_URL = "https://appmeraung.github.io/kendurikita/terms.html";

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
  return <Screen>
    <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}><Text style={styles.label}>‹ {t("back")}</Text></Pressable>
    <Title>{t("kenduriKitaPlans")}</Title>
    {status.names.length ? <Card>
      <Text style={styles.label}>{t("activeSubscription")}</Text>
      <Text style={styles.muted}>{status.names.join(", ")}</Text>
      {status.expiry ? <Text style={styles.muted}>{t("renewsOrExpires", { date: new Date(status.expiry).toLocaleDateString() })}</Text> : null}
      <Button label={t("manageSubscription")} onPress={() => void Linking.openURL(subscriptionManagementUrl())} secondary />
    </Card> : null}
    <Card><Text style={styles.label}>{t("basicFree")}</Text><Text style={styles.muted}>{t("basicPlanSummary")}</Text></Card>
    {packages.map((item) => <Card key={item.identifier}>
      <Text style={styles.label}>{item.product.title} · {item.product.priceString}</Text>
      <Text style={styles.muted}>{item.product.description}</Text>
      <Button label={t("choosePlan")} onPress={() => void buy(item.identifier)} disabled={busy} />
    </Card>)}
    {!purchasesConfigured ? <Card><Text style={styles.muted}>{t("revenueCatNotConfigured")}</Text></Card> : null}
    <Button label={t("restorePurchases")} onPress={() => void restore()} secondary disabled={busy} />
    <Text style={styles.muted}>{t("purchaseLegalPrefix")} <Text style={styles.label} onPress={() => void Linking.openURL(TERMS_URL)}>{t("terms")}</Text> {t("and")} <Text style={styles.label} onPress={() => void Linking.openURL(PRIVACY_URL)}>{t("privacyPolicy")}</Text>. {t("purchaseRenewalNote")}</Text>
  </Screen>;
}
