import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { ChipPeriod, ChipVendorPlan, chipPaymentsEnabled, createChipVendorPurchase } from "../../services/chip";
import { Button, Card, Screen, styles, Title } from "../../ui";

const options: { plan: ChipVendorPlan; period: ChipPeriod; price?: string }[] = [
  { plan: "vendor_pro", period: "month", price: process.env.EXPO_PUBLIC_CHIP_VENDOR_PRO_MONTHLY_LABEL },
  { plan: "vendor_pro", period: "year", price: process.env.EXPO_PUBLIC_CHIP_VENDOR_PRO_YEARLY_LABEL },
  { plan: "vendor_premium", period: "month", price: process.env.EXPO_PUBLIC_CHIP_VENDOR_PREMIUM_MONTHLY_LABEL },
  { plan: "vendor_premium", period: "year", price: process.env.EXPO_PUBLIC_CHIP_VENDOR_PREMIUM_YEARLY_LABEL },
];

export default function VendorPaywall() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const checkout = async (plan: ChipVendorPlan, period: ChipPeriod) => {
    setBusy(true);
    try { await Linking.openURL(await createChipVendorPurchase(plan, period)); }
    catch (error) { Alert.alert(t("purchaseIncomplete"), error instanceof Error ? error.message : t("unknownError")); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Pressable onPress={() => router.back()}><Text style={styles.label}>‹ {t("back")}</Text></Pressable>
    <Title>{t("vendorPlans")}</Title>
    <Card><Text style={styles.muted}>{t("chipVendorPaymentNote")}</Text></Card>
    {options.map((option) => <Card key={`${option.plan}-${option.period}`}><Text style={styles.label}>{option.plan === "vendor_pro" ? "Vendor Pro" : "Vendor Premium"} · {t(option.period === "month" ? "billingMonthly" : "billingYearly")}</Text><Text style={styles.muted}>{option.price || t("priceAtCheckout")}</Text><Button label={t("continueToSecurePayment")} onPress={() => void checkout(option.plan, option.period)} disabled={busy || !chipPaymentsEnabled} /></Card>)}
    {!chipPaymentsEnabled ? <Card><Text style={styles.muted}>{t("chipPaymentsUnavailable")}</Text></Card> : null}
  </Screen>;
}
