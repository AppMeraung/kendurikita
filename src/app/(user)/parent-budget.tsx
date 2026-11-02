import { useEffect, useMemo, useState } from "react";
import { Alert, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { money } from "../../domain";
import { parentBudgetSummary } from "../../domain/parentBudget";
import { planAllows } from "../../domain/plans";
import {
  addFamilyContribution,
  loadFamilyContributions,
} from "../../services/parentBudget";
import { resolveUserPlan } from "../../services/plans";
import { useAppState } from "../../state/AppState";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";
import { router } from "expo-router";

type Contribution = {
  id: string;
  amount: number;
  note?: string;
  created_at: string;
};

export default function ParentBudget() {
  const { t } = useTranslation();
  const { event } = useAppState();
  const [plan, setPlan] = useState<"basic" | "pro" | "premium">("basic");
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Contribution[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const load = async () => {
    if (!event?.cloudId) return;
    try {
      setItems(
        (await loadFamilyContributions(event.cloudId)) as Contribution[],
      );
    } catch (error) {
      Alert.alert(
        t("contributionLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    void resolveUserPlan()
      .then(setPlan)
      .finally(() => setReady(true));
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.cloudId]);
  const summary = useMemo(
    () =>
      parentBudgetSummary(
        event?.budget || [],
        items.map((item) => Number(item.amount)),
      ),
    [event?.budget, items],
  );
  if (!event || !ready) return null;
  if (!planAllows(plan, "pro"))
    return (
      <Screen>
        <Title>{t("parentBudget")}</Title>
        <Card>
          <Text style={styles.muted}>{t("proFeatureRequired")}</Text>
          <Button
            label={t("viewPackages")}
            onPress={() => router.push("/(user)/paywall")}
          />
        </Card>
      </Screen>
    );
  const contribute = async () => {
    const value = Number(amount);
    if (!event.cloudId) return Alert.alert(t("syncRequired"));
    if (!Number.isFinite(value) || value <= 0)
      return Alert.alert(t("amountInvalid"));
    try {
      await addFamilyContribution(event.cloudId, value, note);
      setAmount("");
      setNote("");
      await load();
    } catch (error) {
      Alert.alert(
        t("contributionSaveFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("parentBudget")}</Title>
      <Card>
        <Text style={styles.label}>{t("readOnlyBudget")}</Text>
        <Text style={styles.metric}>
          {money(summary.planned, event.country)}
        </Text>
        <Text style={styles.muted}>
          {t("paid")}: {money(summary.paid, event.country)}
        </Text>
        <Text style={styles.muted}>
          {t("familyContributions")}:{" "}
          {money(summary.familyContributions, event.country)}
        </Text>
        <Text style={styles.muted}>
          {t("balanceOwed")}: {money(summary.owed, event.country)}
        </Text>
      </Card>
      <Card>
        <Text style={styles.label}>{t("budgetSplit")}</Text>
        <Text style={styles.muted}>
          {t("brideSide")}: {money(summary.byPayer.bride, event.country)}
        </Text>
        <Text style={styles.muted}>
          {t("groomSide")}: {money(summary.byPayer.groom, event.country)}
        </Text>
        <Text style={styles.muted}>
          {t("shared")}: {money(summary.byPayer.shared, event.country)}
        </Text>
      </Card>
      <Card>
        <Text style={styles.label}>{t("addFamilyContribution")}</Text>
        <Field
          value={amount}
          onChangeText={setAmount}
          placeholder={t("amount")}
          keyboardType="numeric"
        />
        <Field value={note} onChangeText={setNote} placeholder={t("note")} />
        <Button
          label={t("saveContribution")}
          onPress={() => void contribute()}
        />
      </Card>
      {items.map((item) => (
        <Card key={item.id}>
          <Text style={styles.label}>
            {money(Number(item.amount), event.country)}
          </Text>
          <Text style={styles.muted}>{item.note}</Text>
          <Text style={styles.muted}>{item.created_at.slice(0, 10)}</Text>
        </Card>
      ))}
    </Screen>
  );
}
