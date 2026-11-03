import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { TimelineItem } from "../../domain";
import {
  overlappingTimeline,
  sortTimeline,
  validTimelineRange,
} from "../../domain/timeline";
import { useAppState } from "../../state/AppState";
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

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const { event, addTimeline, updateTimeline, deleteTimeline } = useAppState();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [pic, setPic] = useState("");
  const [note, setNote] = useState("");
  const sorted = useMemo(
    () => sortTimeline(event?.timeline || []),
    [event?.timeline],
  );
  if (!event) return null;
  const clear = () => {
    setEditingId(null);
    setTitle("");
    setDate(event.date || "");
    setStart("09:00");
    setEnd("10:00");
    setPic("");
    setNote("");
    setOpen(false);
  };
  const beginAdd = () => {
    setDate(event.date || "");
    setOpen(true);
  };
  const edit = (item: TimelineItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDate(item.date);
    setStart(item.start);
    setEnd(item.end);
    setPic(item.pic || "");
    setNote(item.note || "");
    setOpen(true);
  };
  const submit = () => {
    if (!title.trim() || !date) return Alert.alert(t("required"));
    if (!validTimelineRange(start, end)) return Alert.alert(t("invalidTime"));
    const value = {
      title: title.trim(),
      date,
      start,
      end,
      pic: pic.trim() || undefined,
      note: note.trim() || undefined,
    };
    if (overlappingTimeline(event.timeline, value, editingId || undefined))
      return Alert.alert(t("timelineOverlap"));
    if (editingId) updateTimeline(editingId, value);
    else addTimeline(value);
    clear();
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title subtitle={t("scheduleIntro")}>{t("scheduleTitle")}</Title>
      <Pressable accessibilityRole="button" accessibilityLabel={t("eventDate")} onPress={() => router.push("/(user)/events")}>
        <Card>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={24} color={palette.maroon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{event.name}</Text>
              <Text style={styles.muted}>{event.date ? new Date(`${event.date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : t("notSet")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
          </View>
        </Card>
      </Pressable>
      {sorted.length ? (
        <Card>
          {sorted.map((item, index) => {
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            const current = item.date === today && item.start <= clock && clock < item.end;
            const newDay = index === 0 || sorted[index - 1].date !== item.date;
            return (
              <View key={item.id}>
                {newDay && sorted.some((other) => other.date !== item.date) ? <Text style={[styles.label, { color: palette.gold, marginBottom: 6 }]}>{item.date}</Text> : null}
                <Pressable onPress={() => edit(item)} accessibilityRole="button" accessibilityLabel={`${t("edit")} ${item.title}`} style={{ flexDirection: "row", gap: 12 }}>
                  <Text style={[styles.label, { width: 50, fontSize: 13, color: current ? palette.maroon : palette.ink }]}>{item.start}</Text>
                  <View style={{ alignItems: "center", width: 12 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 3, backgroundColor: current ? palette.maroon : palette.white, borderWidth: 2, borderColor: palette.maroon }} />
                    {index < sorted.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: palette.line, minHeight: 24 }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Text style={[styles.label, { fontWeight: current ? "800" : "600", color: current ? palette.maroon : palette.ink }]}>{item.title}</Text>
                    <Text style={[styles.muted, { fontSize: 13 }]}>
                      {item.start}–{item.end}
                      {item.pic ? ` · ${t("pic")}: ${item.pic}` : ""}
                    </Text>
                    {item.note ? <Text style={[styles.muted, { fontSize: 13 }]}>{item.note}</Text> : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </Card>
      ) : (
        <Empty
          icon="🕒"
          text={t("emptyTimeline")}
          action={t("addTimeline")}
          onPress={beginAdd}
        />
      )}
      <Button icon="add" label={t("addTimeline")} onPress={beginAdd} />
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>{editingId ? t("editTimeline") : t("addTimeline")}</Title>
          <Field
            value={title}
            onChangeText={setTitle}
            placeholder={t("task")}
          />
          <Field value={date} onChangeText={setDate} placeholder={t("dateFormatPlaceholder")} />
          <Text style={styles.label}>{t("startTime")}</Text>
          <Field value={start} onChangeText={setStart} placeholder={t("timeFormatPlaceholder")} />
          <Text style={styles.label}>{t("endTime")}</Text>
          <Field value={end} onChangeText={setEnd} placeholder={t("timeFormatPlaceholder")} />
          <Field value={pic} onChangeText={setPic} placeholder={t("pic")} />
          <Field
            value={note}
            onChangeText={setNote}
            placeholder={t("note")}
            multiline
          />
          <Button label={t("save")} onPress={submit} />
          <Button label={t("cancel")} onPress={clear} secondary />
          {editingId ? (
            <Button
              icon="trash-outline"
              label={t("delete")}
              secondary
              onPress={() =>
                Alert.alert(t("deleteConfirm"), "", [
                  { text: t("cancel") },
                  { text: t("delete"), style: "destructive", onPress: () => { deleteTimeline(editingId); clear(); } },
                ])
              }
            />
          ) : null}
        </Screen>
      </Modal>
    </Screen>
  );
}
