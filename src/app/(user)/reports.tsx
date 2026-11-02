import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Alert, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import {
  budgetSummary,
  checklistProgress,
  guestSummary,
  inventoryProgress,
  money,
} from "../../domain";
import { userFeature } from "../../domain/entitlements";
import { shareEventReport } from "../../services/reportExport";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Button, Card, palette, Screen, styles, Title } from "../../ui";

export default function Reports() {
  const { t } = useTranslation();
  const { event } = useAppState();
  const { plan, loading } = useUserPlan(event?.cloudId);
  if (!event) return null;
  if (loading) return null;
  if (!userFeature(plan, "exports"))
    return (
      <Screen>
        <Title>{t("reportsTitle")}</Title>
        <Card>
          <Text style={styles.muted}>{t("proFeatureRequired")}</Text>
          <Button
            label={t("viewPackages")}
            onPress={() => router.push("/(user)/paywall")}
          />
        </Card>
      </Screen>
    );
  const budget = budgetSummary(event.budget, event.totalBudget);
  const guests = guestSummary(event.guests);
  const inventory = inventoryProgress(event.inventory);
  const share = async () => {
    try {
      await shareEventReport(event);
    } catch (error) {
      Alert.alert(
        t("reportFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("reportsTitle")}</Title>
      <Card>
        <Text style={styles.label}>{event.name}</Text>
        <Text style={styles.muted}>
          {event.date || "—"} · {event.venue || "—"}
        </Text>
      </Card>
      <Card>
        <Text style={styles.label}>{t("budget")}</Text>
        <Text style={styles.muted}>
          {money(budget.paid, event.country)} /{" "}
          {money(event.totalBudget, event.country)} · {t("paymentOutstanding")}:{" "}
          {money(budget.owed, event.country)}
        </Text>
      </Card>
      <Card>
        <Text style={styles.label}>{t("guests")}</Text>
        <Text style={styles.muted}>
          {guests.confirmed}/{guests.total} {t("confirmed")} · {guests.pending}{" "}
          {t("pending")}
        </Text>
      </Card>
      <Card>
        <Text style={styles.label}>{t("checklist")}</Text>
        <Text style={styles.muted}>{checklistProgress(event.checklist)}%</Text>
      </Card>
      <Card>
        <Text style={styles.label}>{t("inventoryTitle")}</Text>
        <Text style={styles.muted}>
          {inventory.completed}/{inventory.target} · {inventory.percent}%
        </Text>
      </Card>
      <Button label={t("reportExport")} onPress={() => void share()} />
    </Screen>
  );
}
