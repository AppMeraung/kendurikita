import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { ContextHelp } from "../../components/Guidance";
import { BudgetItem, budgetSummary, money, validAmount } from "../../domain";
import { allocatedCategoryBudget } from "../../domain/budgetCategories";
import { userFeature } from "../../domain/entitlements";
import { shareBudgetCsv, shareBudgetPdf } from "../../services/budgetExport";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { router } from "expo-router";
import {
  Button,
  Card,
  Empty,
  Field,
  ListPicker,
  palette,
  ProgressBar,
  Screen,
  Segmented,
  styles,
  Title,
} from "../../ui";

const categoryKeys: Record<string, string> = {
  Dewan: "categoryHall",
  Katering: "categoryCatering",
  Pelamin: "categoryDais",
  Busana: "categoryAttire",
  "Foto & Video": "categoryPhotoVideo",
  Hantaran: "categoryHantaran",
  "Door gift": "categoryDoorGift",
  "Lain-lain": "categoryOther",
};
const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dewan: "business-outline",
  Katering: "restaurant-outline",
  Pelamin: "flower-outline",
  Busana: "shirt-outline",
  "Foto & Video": "camera-outline",
  Hantaran: "gift-outline",
  "Door gift": "bag-handle-outline",
};
const paymentTypeKeys = {
  deposit: "deposit",
  balance: "balance",
  full: "fullPayment",
} as const;
const payerKeys = {
  bride: "brideSide",
  groom: "groomSide",
  shared: "shared",
} as const;
type StatusFilter = "all" | "paid" | "unpaid";
type Sort = "due" | "amount";

export default function Budget() {
  const { t } = useTranslation();
  const {
    event,
    addBudget,
    restoreBudget,
    updateBudget,
    deleteBudget,
    updateEvent,
  } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [totalOpen, setTotalOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryPercent, setCategoryPercent] = useState("");
  const [total, setTotal] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Katering");
  const [planned, setPlanned] = useState("");
  const [paid, setPaid] = useState("");
  const [vendor, setVendor] = useState("");
  const [paymentType, setPaymentType] =
    useState<BudgetItem["paymentType"]>("deposit");
  const [paymentMethod, setPaymentMethod] =
    useState<BudgetItem["paymentMethod"]>("bank");
  const [payer, setPayer] = useState<BudgetItem["payer"]>("shared");
  const [paidAt, setPaidAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [receiptUri, setReceiptUri] = useState<string>();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("due");
  const [deleted, setDeleted] = useState<BudgetItem | null>(null);
  const configuredCategories = event?.budgetCategories || [];
  const visible = useMemo(
    () =>
      event?.budget
        .filter(
          (item) =>
            (categoryFilter === "all" || item.category === categoryFilter) &&
            (statusFilter === "all" ||
              (statusFilter === "paid"
                ? item.paid >= item.planned
                : item.paid < item.planned)),
        )
        .sort((a, b) =>
          sort === "amount"
            ? b.planned - a.planned
            : (a.dueAt || "9999").localeCompare(b.dueAt || "9999"),
        ) || [],
    [categoryFilter, event?.budget, sort, statusFilter],
  );
  if (!event) return null;
  const summary = budgetSummary(event.budget, event.totalBudget);

  const clear = () => {
    setEditingId(null);
    setName("");
    setCategory(configuredCategories[1]?.name || configuredCategories[0]?.name || "Lain-lain");
    setPlanned("");
    setPaid("");
    setVendor("");
    setPaymentType("deposit");
    setPaymentMethod("bank");
    setPayer("shared");
    setPaidAt("");
    setDueAt("");
    setNote("");
    setReceiptUri(undefined);
    setOpen(false);
  };
  const submit = () => {
    if (!name.trim()) return Alert.alert(t("required"));
    if (
      !validAmount(planned) ||
      !validAmount(paid) ||
      Number(paid) > Number(planned)
    )
      return Alert.alert(t("invalidNumber"));
    const value = {
      name: name.trim(),
      category: category.trim() || configuredCategories.at(-1)?.name || "Lain-lain",
      planned: Number(planned),
      paid: Number(paid),
      vendor: vendor.trim() || undefined,
      paymentType,
      paymentMethod,
      payer,
      paidAt: paidAt || undefined,
      dueAt: dueAt || undefined,
      note: note.trim() || undefined,
      receiptUri,
    };
    if (editingId) updateBudget(editingId, value);
    else addBudget(value);
    clear();
  };
  const editItem = (item: BudgetItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setPlanned(`${item.planned}`);
    setPaid(`${item.paid}`);
    setVendor(item.vendor || "");
    setPaymentType(item.paymentType || "deposit");
    setPaymentMethod(item.paymentMethod || "bank");
    setPayer(item.payer || "shared");
    setPaidAt(item.paidAt || "");
    setDueAt(item.dueAt || "");
    setNote(item.note || "");
    setReceiptUri(item.receiptUri);
    setOpen(true);
  };
  const pickReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert(t("photoPermissionRequired"));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  };
  const remove = (item: BudgetItem) => {
    deleteBudget(item.id);
    setDeleted(item);
  };
  const exportFile = async (kind: "pdf" | "csv") => {
    try {
      if (kind === "pdf")
        await shareBudgetPdf(
          event.name,
          event.totalBudget,
          event.country,
          event.budget,
        );
      else await shareBudgetCsv(event.name, event.budget);
    } catch (error) {
      Alert.alert(
        t("exportFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const categoryLabel = (name: string) => categoryKeys[name] ? t(categoryKeys[name]) : name;
  const editCategory = (id?: string) => {
    const selected = configuredCategories.find((item) => item.id === id);
    setEditingCategoryId(selected?.id || null);
    setCategoryName(selected?.name || "");
    setCategoryPercent(selected?.percent === undefined ? "" : `${selected.percent}`);
    setCategoryOpen(true);
  };
  const saveCategory = () => {
    const nextName = categoryName.trim();
    if (!nextName) return Alert.alert(t("required"));
    if (configuredCategories.some((item) => item.id !== editingCategoryId && item.name.toLowerCase() === nextName.toLowerCase()))
      return Alert.alert(t("categoryAlreadyExists"));
    const nextPercent = categoryPercent.trim() === "" ? undefined : Number(categoryPercent);
    if (nextPercent !== undefined && (!Number.isFinite(nextPercent) || nextPercent < 0 || nextPercent > 100))
      return Alert.alert(t("invalidPercentage"));
    const otherTotal = configuredCategories.reduce((sum, item) => sum + (item.id === editingCategoryId ? 0 : item.percent || 0), 0);
    if (otherTotal + (nextPercent || 0) > 100) return Alert.alert(t("percentageTotalWarning"));
    const existingCategory = configuredCategories.find((item) => item.id === editingCategoryId);
    const oldName = existingCategory?.name;
    const budgetCategories = existingCategory
      ? configuredCategories.map((item) => item.id === editingCategoryId ? { ...item, name: nextName, percent: nextPercent } : item)
      : [...configuredCategories, { id: `${Date.now()}`, name: nextName, percent: nextPercent }];
    updateEvent({
      budgetCategories,
      budget: oldName && oldName !== nextName
        ? event.budget.map((item) => item.category === oldName ? { ...item, category: nextName } : item)
        : event.budget,
    });
    setCategoryOpen(false);
  };
  const moveCategory = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= configuredCategories.length) return;
    const next = [...configuredCategories];
    [next[index], next[target]] = [next[target], next[index]];
    updateEvent({ budgetCategories: next });
  };
  const deleteCategory = (id: string) => {
    if (configuredCategories.length <= 1) return Alert.alert(t("categoryRequired"));
    const removed = configuredCategories.find((item) => item.id === id);
    const remaining = configuredCategories.filter((item) => item.id !== id);
    const fallback = remaining.find((item) => item.name === "Lain-lain") || remaining.at(-1)!;
    updateEvent({
      budgetCategories: remaining,
      budget: event.budget.map((item) => item.category === removed?.name ? { ...item, category: fallback.name } : item),
    });
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={() => router.back()} hitSlop={10}><Ionicons name="arrow-back" size={26} color={palette.maroon} /></Pressable>
      <View style={styles.between}><Title subtitle={t("budgetIntro")}>{t("budgetTitle")}</Title><ContextHelp title={t("budgetTitle")} body={t("budgetHelp")} /></View>
      <LinearGradient colors={["#8E2342", palette.maroonDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}><Ionicons name="wallet-outline" size={24} color={palette.white} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,253,248,0.85)", fontWeight: "600" }}>{t("budgetTotal")}</Text>
          <Text style={{ color: palette.white, fontSize: 26, fontWeight: "800" }}>{money(event.totalBudget, event.country)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("edit")}
          hitSlop={10}
          onPress={() => {
            setTotal(`${event.totalBudget}`);
            setTotalOpen(true);
          }}
        >
          <Ionicons name="create-outline" size={22} color={palette.white} />
        </Pressable>
      </LinearGradient>
      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, alignItems: "center", gap: 4 }]}>
          <Ionicons name="card-outline" size={22} color={palette.maroon} />
          <Text style={styles.muted}>{t("paid")}</Text>
          <Text style={[styles.label, { fontSize: 17 }]}>{money(summary.paid, event.country)}</Text>
        </View>
        <View style={[styles.card, { flex: 1, alignItems: "center", gap: 4 }]}>
          <Ionicons name="cash-outline" size={22} color={summary.remaining < 0 ? palette.danger : palette.maroon} />
          <Text style={styles.muted}>{t("remaining")}</Text>
          <Text style={[styles.label, { fontSize: 17 }, summary.remaining < 0 && { color: palette.danger }]}>{summary.remaining < 0 ? "-" : ""}{money(Math.abs(summary.remaining), event.country)}</Text>
        </View>
      </View>
      <Card>
        <ProgressBar value={event.totalBudget > 0 ? summary.paid / event.totalBudget : 0} />
        <View style={styles.between}>
          <Text style={[styles.muted, { fontSize: 13 }]}>{t("planned")}: {money(summary.planned, event.country)} · {t("owed")}: {money(summary.owed, event.country)}</Text>
          <Text style={[styles.label, { color: palette.maroon }]}>{t("percentSpent", { percent: event.totalBudget > 0 ? Math.round((summary.paid / event.totalBudget) * 100) : 0 })}</Text>
        </View>
        {summary.remaining < 0 ? <Text style={styles.danger}>{t("overBudget")}</Text> : null}
        {summary.percent >= 90 ? (
          <Text style={styles.danger}>
            {t("budgetUsedWarning", { percent: summary.percent })}
          </Text>
        ) : null}
        {summary.overBudget ? (
          <Text style={styles.danger}>{t("plannedOverBudget")}</Text>
        ) : null}
      </Card>
      <View style={styles.between}>
        <Text style={styles.label}>{t("budgetCategories")}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t("manageCategories")} onPress={() => editCategory()} hitSlop={8} style={styles.row}><Ionicons name="options-outline" size={16} color={palette.maroon} /><Text style={{ color: palette.maroon, fontWeight: "700" }}>{t("manageCategories")}</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("vendorBalances")} onPress={() => router.push("/(user)/payments")} style={[styles.card, styles.row]}>
        <Ionicons name="alarm-outline" size={20} color={palette.maroon} />
        <View style={{ flex: 1 }}><Text style={styles.label}>{t("vendorBalances")}</Text><Text style={[styles.muted, { fontSize: 12 }]}>{t("vendorBalancesHint")}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={palette.muted} />
      </Pressable>
      <Card>
      {configuredCategories.map((budgetCategory, index) => {
        const items = event.budget.filter((item) => item.category === budgetCategory.name);
        const itemPlanned = items.reduce((sum, item) => sum + item.planned, 0);
        const paidAmount = items.reduce((sum, item) => sum + item.paid, 0);
        const allocated = allocatedCategoryBudget(event.totalBudget, budgetCategory, itemPlanned);
        return (
          <View key={budgetCategory.id} style={[styles.row, { alignItems: "flex-start" }, index > 0 && { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12 }]}>
            <Ionicons name={categoryIcons[budgetCategory.name] || "pricetag-outline"} size={22} color={palette.maroon} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.between}>
                <Text style={styles.label}>{categoryLabel(budgetCategory.name)}</Text>
                <Text style={[styles.label, itemPlanned > allocated && { color: palette.danger }]}>{money(allocated, event.country)}</Text>
              </View>
              <Text style={[styles.muted, { fontSize: 13 }]}>
                {budgetCategory.percent === undefined ? t("noPercentageSplit") : `${budgetCategory.percent}%`} · {t("planned")}: {money(itemPlanned, event.country)}
              </Text>
              <Text style={[paidAmount > allocated ? styles.danger : styles.muted, { fontSize: 13 }]}>
                {t("paid")}: {money(paidAmount, event.country)} · {t("remaining")}: {money(allocated - paidAmount, event.country)}
              </Text>
            </View>
          </View>
        );
      })}
      </Card>
      <Card>
        <Text style={styles.label}>{t("filtersAndSort")}</Text>
        <Segmented options={[["all", t("all")], ["paid", t("paidFilter")], ["unpaid", t("unpaidFilter")]] as const} value={statusFilter} onChange={setStatusFilter} />
        <Segmented options={[["due", t("dueDateSort")], ["amount", t("amountSort")]] as const} value={sort} onChange={setSort} />
        <ListPicker icon="pricetags-outline" label={t("category")} value={categoryFilter} options={[["all", t("all")] as const, ...configuredCategories.map((item) => [item.name, categoryLabel(item.name)] as const)]} onChange={setCategoryFilter} />
      </Card>
      {deleted ? (
        <Card>
          <Text style={styles.muted}>
            {t("deleteUndo")}: {deleted.name}
          </Text>
          <Button
            label={t("undo")}
            onPress={() => {
              restoreBudget(deleted);
              setDeleted(null);
            }}
            secondary
          />
        </Card>
      ) : null}
      {event.budget.length === 0 ? (
        <Empty
          icon="🧾"
          text={t("emptyBudget")}
          action={t("firstExpense")}
          onPress={() => setOpen(true)}
        />
      ) : visible.length === 0 ? (
        <Empty
          icon="🔎"
          text={t("noFilteredBudget")}
          action={t("clearFilters")}
          onPress={() => {
            setCategoryFilter("all");
            setStatusFilter("all");
          }}
        />
      ) : (
        visible.map((item) => (
          <Card key={item.id}>
            <View style={styles.between}>
              <Pressable
                accessibilityLabel={`${t("edit")} ${item.name}`}
                onPress={() => editItem(item)}
                style={{ flex: 1 }}
              >
                <Text style={styles.label}>{item.name}</Text>
                <Text style={styles.muted}>
                  {item.category}
                  {item.vendor ? ` · ${item.vendor}` : ""}
                </Text>
                <Text style={styles.muted}>
                  {t("paid")} {money(item.paid, event.country)} /{" "}
                  {money(item.planned, event.country)}
                  {item.dueAt ? ` · ${item.dueAt}` : ""}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={t("delete")}
                onPress={() =>
                  Alert.alert(t("deleteConfirm"), "", [
                    { text: t("cancel") },
                    {
                      text: t("delete"),
                      style: "destructive",
                      onPress: () => remove(item),
                    },
                  ])
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={palette.danger}
                />
              </Pressable>
            </View>
          </Card>
        ))
      )}
      <Button label={t("addExpense")} onPress={() => setOpen(true)} />
      {userFeature(plan, "exports") ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("exportPdf")}
              onPress={() => void exportFile("pdf")}
              secondary
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("exportCsv")}
              onPress={() => void exportFile("csv")}
              secondary
            />
          </View>
        </View>
      ) : (
        <Button
          label={t("upgradeForExports")}
          onPress={() => router.push("/(user)/paywall")}
          secondary
        />
      )}
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>
            {editingId ? `${t("edit")} ${t("expenseName")}` : t("addExpense")}
          </Title>
          <Field
            placeholder={t("expenseName")}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>{t("category")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {configuredCategories.map((configured) => (
              <Button
                key={configured.id}
                label={categoryLabel(configured.name)}
                onPress={() => setCategory(configured.name)}
                secondary={category !== configured.name}
              />
            ))}
          </View>
          <Field
            placeholder={t("category")}
            value={category}
            onChangeText={setCategory}
          />
          <Field
            placeholder={t("optionalVendor")}
            value={vendor}
            onChangeText={setVendor}
          />
          <Field
            placeholder={t("amountPlanned")}
            value={planned}
            onChangeText={setPlanned}
            keyboardType="numeric"
          />
          <Field
            placeholder={t("amountPaid")}
            value={paid}
            onChangeText={setPaid}
            keyboardType="numeric"
          />
          <Text style={styles.label}>{t("paymentType")}</Text>
          <Segmented options={(["deposit", "balance", "full"] as const).map((item) => [item, t(paymentTypeKeys[item])] as const)} value={paymentType || "deposit"} onChange={setPaymentType} />
          <Text style={styles.label}>{t("paidBy")}</Text>
          <Segmented options={(["bride", "groom", "shared"] as const).map((item) => [item, t(payerKeys[item])] as const)} value={payer || "shared"} onChange={setPayer} />
          <Field
            placeholder={t("paidDateHint")}
            value={paidAt}
            onChangeText={setPaidAt}
          />
          <Field
            placeholder={t("dueDateHint")}
            value={dueAt}
            onChangeText={setDueAt}
          />
          <Field
            placeholder={t("note")}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <Button
            label={t("chooseReceipt")}
            onPress={() => void pickReceipt()}
            secondary
          />
          {receiptUri ? (
            <Image
              source={receiptUri}
              style={{ width: "100%", height: 180, borderRadius: 12 }}
              contentFit="cover"
            />
          ) : null}
          <Button label={t("save")} onPress={submit} />
          <Button label={t("cancel")} onPress={clear} secondary />
        </Screen>
      </Modal>
      <Modal visible={totalOpen} animationType="fade" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "#0008",
          }}
        >
          <Card>
            <Title>{t("totalBudget")}</Title>
            <Field
              value={total}
              onChangeText={setTotal}
              keyboardType="numeric"
            />
            <Button
              label={t("save")}
              onPress={() => {
                if (validAmount(total)) {
                  updateEvent({ totalBudget: Number(total) });
                  setTotalOpen(false);
                } else Alert.alert(t("invalidNumber"));
              }}
            />
            <Button
              label={t("cancel")}
              onPress={() => setTotalOpen(false)}
              secondary
            />
          </Card>
        </View>
      </Modal>
      <Modal visible={categoryOpen} animationType="slide" onRequestClose={() => setCategoryOpen(false)}>
        <Screen>
          <Title>{editingCategoryId ? t("editCategory") : t("manageCategories")}</Title>
          {editingCategoryId ? (
            <>
              <Field value={categoryName} onChangeText={setCategoryName} placeholder={t("categoryName")} />
              <Field value={categoryPercent} onChangeText={setCategoryPercent} keyboardType="decimal-pad" placeholder={t("optionalPercentage")} />
              <Button label={t("save")} onPress={saveCategory} />
              <Button label={t("cancel")} onPress={() => setCategoryOpen(false)} secondary />
            </>
          ) : (
            <>
              <Text style={styles.muted}>{t("categorySplitHint")}</Text>
              {configuredCategories.map((item, index) => (
                <Card key={item.id}>
                  <Pressable accessibilityLabel={t("editCategory")} onPress={() => editCategory(item.id)}>
                    <Text style={styles.label}>{categoryLabel(item.name)}</Text>
                    <Text style={styles.muted}>{item.percent === undefined ? t("noPercentageSplit") : `${item.percent}%`}</Text>
                  </Pressable>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <Button label="↑" onPress={() => moveCategory(index, -1)} secondary />
                    <Button label="↓" onPress={() => moveCategory(index, 1)} secondary />
                    <Button
                      label={t("delete")}
                      onPress={() => Alert.alert(t("deleteConfirm"), t("categoryDeleteReassign"), [
                        { text: t("cancel") },
                        { text: t("delete"), style: "destructive", onPress: () => deleteCategory(item.id) },
                      ])}
                      secondary
                    />
                  </View>
                </Card>
              ))}
              <Button label={t("addCategory")} onPress={() => {
                setEditingCategoryId("new");
                setCategoryName("");
                setCategoryPercent("");
              }} />
              <Button label={t("done")} onPress={() => setCategoryOpen(false)} secondary />
            </>
          )}
        </Screen>
      </Modal>
    </Screen>
  );
}
