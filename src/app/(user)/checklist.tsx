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
import {
  Button,
  Card,
  Empty,
  Field,
  palette,
  Screen,
  styles,
  Title,
} from "../../ui";

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
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("due");
  const visible = useMemo(
    () =>
      sortChecklist(
        event?.checklist.filter(
          (item) =>
            (!incompleteOnly || !item.done) &&
            `${item.title} ${item.assignedTo || ""}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        ) || [],
        sort,
      ),
    [event?.checklist, incompleteOnly, query, sort],
  );
  if (!event) return null;

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
      <View style={styles.between}><Title>{t("checklist")}</Title><ContextHelp title={t("checklist")} body={t("checklistHelp")} /></View>
      <Field
        value={query}
        onChangeText={setQuery}
        placeholder={`${t("task")} / ${t("assignee")}`}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          label={t("all")}
          onPress={() => setIncompleteOnly(false)}
          secondary={incompleteOnly}
        />
        <Button
          label={t("incomplete")}
          onPress={() => setIncompleteOnly(true)}
          secondary={!incompleteOnly}
        />
        <Button
          label={t("sortDue")}
          onPress={() => setSort("due")}
          secondary={sort !== "due"}
        />
        <Button
          label={t("sortPriority")}
          onPress={() => setSort("priority")}
          secondary={sort !== "priority"}
        />
        <Button
          label={t("sortAssignee")}
          onPress={() => setSort("assignee")}
          secondary={sort !== "assignee"}
        />
      </View>
      {visible.length ? (
        visible.map((item) => (
          <Card key={item.id}>
            <View style={styles.between}>
              <Pressable
                accessibilityLabel={item.title}
                onPress={() => toggleChecklist(item.id)}
                style={[styles.row, { flex: 1 }]}
              >
                <Ionicons
                  name={item.done ? "checkmark-circle" : "ellipse-outline"}
                  size={25}
                  color={palette.maroon}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.label,
                      item.done && { textDecorationLine: "line-through" },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.muted}>
                    {item.due || t("notSet")} · {t(priorityKeys[item.priority])}
                  </Text>
                  <Text style={styles.muted}>
                    {item.assignedTo || t("unassigned")}
                    {item.reminderAt ? ` · 🔔 ${t("reminder")}` : ""}
                  </Text>
                </View>
              </Pressable>
              <View>
                <Pressable
                  accessibilityLabel={`${t("edit")} ${item.title}`}
                  onPress={() => edit(item)}
                  style={{ padding: 10 }}
                >
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color={palette.maroon}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={`${t("delete")} ${item.title}`}
                  onPress={() =>
                    Alert.alert(t("deleteConfirm"), "", [
                      { text: t("cancel") },
                      {
                        text: t("delete"),
                        style: "destructive",
                        onPress: () => void remove(item),
                      },
                    ])
                  }
                  style={{ padding: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={21}
                    color={palette.danger}
                  />
                </Pressable>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Empty
          icon="✅"
          text={t("noFilteredTasks")}
          action={t("clearFilters")}
          onPress={() => {
            setQuery("");
            setIncompleteOnly(false);
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
          <Field value={due} onChangeText={setDue} placeholder="YYYY-MM-DD" />
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
        </Screen>
      </Modal>
    </Screen>
  );
}
