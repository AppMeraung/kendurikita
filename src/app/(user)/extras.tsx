import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Share, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  cateringQuantities,
  monthlySavings,
  savingsProgress,
} from "../../domain/calculators";
import {
  loadMasKahwinRates,
  loadSavingsGoal,
  MasKahwinRate,
  saveSavingsGoal,
} from "../../services/phase6";
import { cloudConfigured } from "../../services/supabase";
import { useAppState } from "../../state/AppState";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

export default function Extras() {
  const { t } = useTranslation();
  const { event, addBudget, updateBudget } = useAppState();
  const [rates, setRates] = useState<MasKahwinRate[]>([]);
  const [state, setState] = useState("");
  const [agreedMas, setAgreedMas] = useState("");
  const [agreedHantaran, setAgreedHantaran] = useState("");
  const [pax, setPax] = useState(event ? String(event.estimatedGuests) : "");
  const [menu, setMenu] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [reminderDay, setReminderDay] = useState("1");
  const quantities = useMemo(() => cateringQuantities(Number(pax)), [pax]);
  const selectedRate = rates.find((item) => item.state === state);
  useEffect(() => {
    if (!cloudConfigured) return;
    void loadMasKahwinRates()
      .then(setRates)
      .catch(() => setRates([]));
    if (event?.cloudId)
      void loadSavingsGoal(event.cloudId).then((goal) => {
        if (!goal) return;
        setTarget(String(goal.target));
        setSaved(String(goal.current_amount));
        setReminderDay(String(goal.reminder_day || 1));
      });
  }, [event?.cloudId]);
  if (!event) return null;
  const saveBudgetValue = (name: string, category: string, amount: number) => {
    const existing = event.budget.find((item) => item.category === category);
    if (existing)
      updateBudget(existing.id, { name, planned: amount, paid: amount });
    else
      addBudget({
        name,
        category,
        planned: amount,
        paid: amount,
        payer: "shared",
      });
  };
  const shoppingList = [
    menu.trim() ? `${t("menu")}: ${menu.trim()}` : "",
    `${t("estimatedGuests")}: ${Math.max(0, Math.floor(Number(pax) || 0))}`,
    `${t("rice")}: ${quantities.riceKg} kg`,
    `${t("chicken")}: ${quantities.chickenKg} kg`,
    `${t("beef")}: ${quantities.beefKg} kg`,
    `${t("vegetables")}: ${quantities.vegetablesKg} kg`,
    `${t("cookingOil")}: ${quantities.oilLitres} L`,
    `${t("plates")}: ${quantities.plates}`,
    `${t("cups")}: ${quantities.cups}`,
    `${t("tables")}: ${quantities.tables}`,
  ]
    .filter(Boolean)
    .join("\n");
  const monthly = event.date
    ? monthlySavings(Number(target), Number(saved), new Date(event.date))
    : 0;
  const saveGoal = async () => {
    const targetValue = Number(target);
    const savedValue = Number(saved);
    const day = Number(reminderDay);
    if (
      targetValue <= 0 ||
      savedValue < 0 ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > 28
    )
      return Alert.alert(t("savingsInvalid"));
    saveBudgetValue(t("weddingSavings"), "savings_goal", savedValue);
    if (event.cloudId && cloudConfigured)
      await saveSavingsGoal(event.cloudId, targetValue, savedValue, day);
    Alert.alert(t("savingsSaved"));
  };
  return (
    <Screen>
      <Title>{t("planningTools")}</Title>
      <Card>
        <Text style={styles.label}>{t("masKahwinCalculator")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {rates.map((rate) => (
            <Button key={rate.state} label={rate.state} onPress={() => setState(rate.state)} secondary={state !== rate.state} />
          ))}
        </View>
        {selectedRate ? (
          <>
            <Text style={styles.metric}>{t("unmarriedRate")}: RM {Number(selectedRate.unmarried_amount ?? selectedRate.amount).toFixed(2)}</Text>
            <Text style={styles.metric}>{t("previouslyMarriedRate")}: RM {Number(selectedRate.previously_married_amount ?? selectedRate.amount).toFixed(2)}</Text>
            {selectedRate.typical_hantaran_min != null && selectedRate.typical_hantaran_max != null ? <Text style={styles.muted}>
              {t("typicalHantaran")}: RM {Number(selectedRate.typical_hantaran_min).toFixed(2)} – RM {Number(selectedRate.typical_hantaran_max).toFixed(2)}
            </Text> : <Text style={styles.muted}>{t("hantaranRangeUnavailable")}</Text>}
            <Text style={styles.muted}>
              {t("checkedOn")}: {selectedRate.checked_at}
            </Text>
            <Button
              label={t("openOfficialSource")}
              onPress={() => void Linking.openURL(selectedRate.source_url)}
              secondary
            />
          </>
        ) : (
          <Text style={styles.muted}>{t("rateUnavailable")}</Text>
        )}
        <Text style={styles.muted}>{t("confirmReligiousOffice")}</Text>
        <Field
          value={agreedMas}
          onChangeText={setAgreedMas}
          placeholder={t("agreedMasKahwin")}
          keyboardType="numeric"
        />
        <Field
          value={agreedHantaran}
          onChangeText={setAgreedHantaran}
          placeholder={t("agreedHantaran")}
          keyboardType="numeric"
        />
        <Button
          label={t("saveToBudget")}
          onPress={() => {
            const mas = Number(agreedMas);
            const hantaran = Number(agreedHantaran);
            if (mas < 0 || hantaran < 0 || (!mas && !hantaran))
              return Alert.alert(t("amountInvalid"));
            if (mas) saveBudgetValue(t("masKahwin"), "mas_kahwin", mas);
            if (hantaran) saveBudgetValue(t("hantaran"), "hantaran", hantaran);
            Alert.alert(t("saved"));
          }}
        />
      </Card>
      <Card>
        <Text style={styles.label}>{t("cateringCalculator")}</Text>
        <Field
          value={pax}
          onChangeText={setPax}
          placeholder={t("estimatedGuests")}
          keyboardType="numeric"
        />
        <Field
          value={menu}
          onChangeText={setMenu}
          placeholder={t("menuExample")}
          multiline
        />
        <Text style={styles.muted}>{shoppingList}</Text>
        <Button
          label={t("shareShoppingList")}
          onPress={() => void Share.share({ message: shoppingList })}
        />
      </Card>
      <Card>
        <Text style={styles.label}>{t("weddingSavings")}</Text>
        <Field
          value={target}
          onChangeText={setTarget}
          placeholder={t("savingsTarget")}
          keyboardType="numeric"
        />
        <Field
          value={saved}
          onChangeText={setSaved}
          placeholder={t("savedSoFar")}
          keyboardType="numeric"
        />
        <Field
          value={reminderDay}
          onChangeText={setReminderDay}
          placeholder={t("monthlyReminderDay")}
          keyboardType="numeric"
        />
        <Text style={styles.metric}>
          {savingsProgress(Number(target), Number(saved))}%
        </Text>
        <Text style={styles.muted}>
          {event.date
            ? t("savePerMonth", { amount: monthly })
            : t("eventDateRequired")}
        </Text>
        <Button label={t("saveSavingsGoal")} onPress={() => void saveGoal()} />
      </Card>
    </Screen>
  );
}
