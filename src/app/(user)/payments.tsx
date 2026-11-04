import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { money } from "../../domain";
import {
  PaymentStatus,
  paymentReminderDate,
  paymentStatus,
  paymentTotals,
} from "../../domain/payments";
import {
  cancelChecklistReminder,
  schedulePaymentReminder,
} from "../../services/notifications";
import { useAppState } from "../../state/AppState";
import { Button, Card, Empty, palette, Screen, styles, Title } from "../../ui";

type Filter = "all" | PaymentStatus;
const filters: Filter[] = ["all", "due", "overdue", "paid", "unscheduled"];
const localDate = () => {
  const now = new Date();
  const part = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}`;
};

export default function Payments() {
  const { t } = useTranslation();
  const { event, updateBudget } = useAppState();
  const [filter, setFilter] = useState<Filter>("all");
  const today = localDate();
  const visible = useMemo(
    () =>
      (event?.budget || [])
        .filter(
          (item) => filter === "all" || paymentStatus(item, today) === filter,
        )
        .sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999")),
    [event?.budget, filter, today],
  );
  if (!event) return null;
  const totals = paymentTotals(event.budget);
  const remind = async (id: string) => {
    const item = event.budget.find((entry) => entry.id === id);
    if (!item) return;
    const date = paymentReminderDate(item.dueAt);
    if (!date) return Alert.alert(t("paymentReminderInvalid"));
    await cancelChecklistReminder(item.paymentReminderId);
    const reminderId = await schedulePaymentReminder(
      date,
      t("paymentReminderTitle"),
      `${item.vendor || item.name}: ${money(Math.max(0, item.planned - item.paid), event.country)}`,
      item.id,
    );
    if (!reminderId) return Alert.alert(t("reminderPermission"));
    updateBudget(item.id, { paymentReminderId: reminderId });
    Alert.alert(t("paymentReminderSet"));
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("paymentsTitle")}</Title>
      <Card>
        <Text style={styles.label}>
          {t("paymentOutstanding")}: {money(totals.owed, event.country)}
        </Text>
        <Text style={styles.muted}>
          {t("paid")}: {money(totals.paid, event.country)} · {t("planned")}:{" "}
          {money(totals.planned, event.country)}
        </Text>
      </Card>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {filters.map((value) => (
          <Button
            key={value}
            label={t(`paymentStatus_${value}`)}
            onPress={() => setFilter(value)}
            secondary={filter !== value}
          />
        ))}
      </View>
      {!visible.length ? (
        <Empty
          icon="🧾"
          text={t("paymentsEmpty")}
          action={t("paymentManage")}
          onPress={() => router.push("/(user)/budget")}
        />
      ) : (
        visible.map((item) => {
          const status = paymentStatus(item, today);
          const balance = Math.max(0, item.planned - item.paid);
          return (
            <Card key={item.id}>
              <Text style={styles.label}>{item.vendor || item.name}</Text>
              <Text
                style={[
                  styles.muted,
                  status === "overdue" && { color: palette.danger },
                ]}
              >
                {t(`paymentStatus_${status}`)}
                {item.dueAt ? ` · ${item.dueAt}` : ""}
              </Text>
              <Text style={styles.muted}>
                {t("paymentOutstanding")}: {money(balance, event.country)}
              </Text>
              {item.receiptUri ? (
                <Image
                  source={item.receiptUri}
                  style={{ width: "100%", height: 120, borderRadius: 12 }}
                  contentFit="cover"
                />
              ) : null}
              {status !== "paid" ? (
                <Button
                  label={
                    item.paymentReminderId
                      ? t("paymentReminderReset")
                      : t("paymentReminder")
                  }
                  onPress={() => void remind(item.id)}
                  secondary
                />
              ) : null}
            </Card>
          );
        })
      )}
      <Button
        label={t("paymentManage")}
        onPress={() => router.push("/(user)/budget")}
      />
    </Screen>
  );
}
