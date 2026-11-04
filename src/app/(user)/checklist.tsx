import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChecklistItem } from "../../domain";
import {
  checklistReminderDate,
  sortChecklist,
  validDate,
} from "../../domain/checklist";
import {
  cancelChecklistReminder,
  scheduleChecklistReminder,
} from "../../services/notifications";
import { useAppState } from "../../state/AppState";
import { ContextHelp } from "../../components/Guidance";
import { BudgetDonut } from "../../components/BudgetDonut";
import { ChecklistCategory, checklistCategories, checklistCategory } from "../../domain/checklistCategory";
import {
  Button,
  Card,
  Empty,
  Field,
  palette,
  ProgressBar,
  Screen,
  SearchField,
  Segmented,
  styles,
  Title,
} from "../../ui";

const categoryIcons: Record<ChecklistCategory, keyof typeof Ionicons.glyphMap> = {
  planning: "clipboard-outline", venue: "business-outline", guests: "people-outline", food: "restaurant-outline",
  decor: "flower-outline", attire: "shirt-outline", ceremony: "heart-outline", media: "camera-outline",
  transport: "car-outline", safety: "shield-checkmark-outline", after: "ribbon-outline", other: "ellipsis-horizontal-circle-outline",
};

type Sort = "due" | "priority" | "assignee";
const priorityKeys = {
  Tinggi: "priorityHigh",
  Sederhana: "priorityMedium",
  Rendah: "priorityLow",
} as const;

export default function Checklist() {
  const { t } = useTranslation();
  const {
    event,
    toggleChecklist,
    addChecklist,
    updateChecklist,
    deleteChecklist,
  } = useAppState();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] =
    useState<ChecklistItem["priority"]>("Sederhana");
  const [assignedTo, setAssignedTo] = useState("");
  const [reminder, setReminder] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");
  const [sort, setSort] = useState<Sort>("due");
  const [openGroups, setOpenGroups] = useState<ChecklistCategory[]>([]);
  const visible = useMemo(
    () =>
      sortChecklist(
        event?.checklist.filter(
          (item) =>
            (filter === "all" || (filter === "done") === item.done) &&
            `${item.title} ${item.assignedTo || ""}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        ) || [],
        sort,
      ),
    [event?.checklist, filter, query, sort],
  );
  if (!event) return null;
  const doneCount = event.checklist.filter((item) => item.done).length;

  const clear = () => {
    setEditingId(null);
    setTitle("");
    setDue("");
    setPriority("Sederhana");
    setAssignedTo("");
    setReminder(false);
    setOpen(false);
  };
  const edit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDue(item.due);
    setPriority(item.priority);
    setAssignedTo(item.assignedTo || "");
    setReminder(!!item.reminderAt);
    setOpen(true);
  };
  const submit = async () => {
    if (!title.trim()) return Alert.alert(t("required"));
    if (due && !validDate(due)) return Alert.alert(t("invalidNumber"));
    const previous = editingId
      ? event.checklist.find((item) => item.id === editingId)
      : undefined;
    await cancelChecklistReminder(previous?.reminderId);
    let reminderId: string | undefined;
    let reminderAt: string | undefined;
    if (reminder) {
      const date = checklistReminderDate(due);
      if (!date) return Alert.alert(t("reminderPast"));
      reminderId =
        (await scheduleChecklistReminder(
          date,
          t("reminder"),
          title.trim(),
          editingId || `new-${Date.now()}`,
        )) || undefined;
      if (!reminderId) return Alert.alert(t("reminderPermission"));
      reminderAt = date.toISOString();
    }
    const value = {
      title: title.trim(),
      due,
      priority,
      assignedTo: assignedTo.trim() || undefined,
      reminderAt,
      reminderId,
    };
    if (editingId) updateChecklist(editingId, value);
    else addChecklist(value);
    clear();
  };
  const remove = async (item: ChecklistItem) => {
    await cancelChecklistReminder(item.reminderId);
    deleteChecklist(item.id);
  };

  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <View style={styles.between}><Title subtitle={t("checklistIntro")}>{t("checklist")}</Title><ContextHelp title={t("checklist")} body={t("checklistHelp")} /></View>
      <Card>
        <View style={styles.row}>
          <BudgetDonut paid={doneCount} total={event.checklist.length} label={t("yourProgress")} size={84} color={palette.gold} />
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={styles.label}>{t("yourProgress")}</Text>
            <Text style={styles.muted}>{t("tasksCompleted", { done: doneCount, total: event.checklist.length })}</Text>
            <ProgressBar value={event.checklist.length ? doneCount / event.checklist.length : 0} />
          </View>
        </View>
      </Card>
      <Segmented
        options={[["all", `${t("all")} (${event.checklist.length})`], ["todo", `${t("toDo")} (${event.checklist.length - doneCount})`], ["done", `${t("done")} (${doneCount})`]] as const}
        value={filter}
        onChange={setFilter}
      />
      <SearchField value={query} onChangeText={setQuery} placeholder={`${t("task")} / ${t("assignee")}`} accessibilityLabel={t("task")} />
      <Segmented
        options={[["due", t("sortShortDate")], ["priority", t("sortShortPriority")], ["assignee", t("sortShortPic")]] as const}
        value={sort}
        onChange={setSort}
      />
      {visible.length ? (
        <View style={{ gap: 8 }}>
        {checklistCategories.map((category) => {
          const all = event.checklist.filter((item) => checklistCategory(item) === category);
          const items = visible.filter((item) => checklistCategory(item) === category);
          if (!items.length) return null;
          const expanded = query.trim() !== "" || openGroups.includes(category);
          return (
            <Card key={category}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={t(`checklistCat_${category}`)}
                onPress={() => setOpenGroups((current) => (current.includes(category) ? current.filter((value) => value !== category) : [...current, category]))}
                style={styles.row}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={categoryIcons[category]} size={20} color={palette.maroon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t(`checklistCat_${category}`)}</Text>
                  <Text style={[styles.muted, { fontSize: 12 }]}>{t("tasksCompleted", { done: all.filter((item) => item.done).length, total: all.length })}</Text>
                </View>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={palette.muted} />
              </Pressable>
              {expanded ? (
                <>
                  <View style={{ flexDirection: "row", gap: 8, padding: 10, borderRadius: 10, backgroundColor: palette.cream }}>
                    <Ionicons name="time-outline" size={16} color={palette.gold} style={{ marginTop: 2 }} />
                    <Text style={[styles.muted, { flex: 1, fontSize: 13, lineHeight: 19 }]}>{t(`checklistTip_${category}`)}</Text>
                  </View>
                  {items.map((item) => (
                    <View key={item.id} style={[styles.row, { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 10 }]}>
                      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.done }} accessibilityLabel={item.title} onPress={() => toggleChecklist(item.id)} hitSlop={8}>
                        <Ionicons name={item.done ? "checkbox" : "square-outline"} size={24} color={palette.maroon} />
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={`${t("edit")} ${item.title}`} onPress={() => edit(item)} style={[styles.row, { flex: 1 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.label, { fontWeight: "600" }, item.done && { textDecorationLine: "line-through", color: palette.muted }]}>{item.title}</Text>
                          <Text style={[styles.muted, { fontSize: 13 }]}>
                            {item.due || t("notSet")} · {t(priorityKeys[item.priority])} · {item.assignedTo || t("unassigned")}
                            {item.reminderAt ? ` · 🔔` : ""}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={palette.muted} />
                      </Pressable>
                    </View>
                  ))}
                </>
              ) : null}
            </Card>
          );
        })}
        </View>
      ) : (
        <Empty
          icon="✅"
          text={t("noFilteredTasks")}
          action={t("clearFilters")}
          onPress={() => {
            setQuery("");
            setFilter("all");
          }}
        />
      )}
      <Button label={t("addTask")} onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>{editingId ? t("editTask") : t("addTask")}</Title>
          <Field
            value={title}
            onChangeText={setTitle}
            placeholder={t("task")}
          />
          <Field value={due} onChangeText={setDue} placeholder={t("dateFormatPlaceholder")} />
          <Text style={styles.label}>{t("priority")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(
              ["Tinggi", "Sederhana", "Rendah"] as ChecklistItem["priority"][]
            ).map((item) => (
              <Button
                key={item}
                label={t(priorityKeys[item])}
                onPress={() => setPriority(item)}
                secondary={priority !== item}
              />
            ))}
          </View>
          <Field
            value={assignedTo}
            onChangeText={setAssignedTo}
            placeholder={t("assignee")}
          />
          <Button
            label={t("reminderAtNine")}
            onPress={() => setReminder((value) => !value)}
            secondary={!reminder}
          />
          <Button label={t("save")} onPress={() => void submit()} />
          <Button label={t("cancel")} onPress={clear} secondary />
          {editingId ? (
            <Button
              icon="trash-outline"
              label={t("delete")}
              secondary
              onPress={() => {
                const item = event.checklist.find((entry) => entry.id === editingId);
                if (!item) return;
                Alert.alert(t("deleteConfirm"), "", [
                  { text: t("cancel") },
                  { text: t("delete"), style: "destructive", onPress: () => { void remove(item); clear(); } },
                ]);
              }}
            />
          ) : null}
        </Screen>
      </Modal>
    </Screen>
  );
}
