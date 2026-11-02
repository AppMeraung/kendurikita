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
  const { t } = useTranslation();
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
      <Title>{t("scheduleTitle")}</Title>
      {sorted.length ? (
        sorted.map((item) => (
          <Card key={item.id}>
            <View style={styles.between}>
              <Pressable
                onPress={() => edit(item)}
                accessibilityLabel={`${t("edit")} ${item.title}`}
                style={{ flex: 1 }}
              >
                <Text style={styles.label}>
                  {item.start}–{item.end} · {item.title}
                </Text>
                <Text style={styles.muted}>
                  {item.date}
                  {item.pic ? ` · ${t("pic")}: ${item.pic}` : ""}
                </Text>
                {item.note ? (
                  <Text style={styles.muted}>{item.note}</Text>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityLabel={`${t("delete")} ${item.title}`}
                onPress={() =>
                  Alert.alert(t("deleteConfirm"), "", [
                    { text: t("cancel") },
                    {
                      text: t("delete"),
                      style: "destructive",
                      onPress: () => deleteTimeline(item.id),
                    },
                  ])
                }
                style={{ padding: 10 }}
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
      ) : (
        <Empty
          icon="🕒"
          text={t("emptyTimeline")}
          action={t("addTimeline")}
          onPress={beginAdd}
        />
      )}
      <Button label={t("addTimeline")} onPress={beginAdd} />
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
        </Screen>
      </Modal>
    </Screen>
  );
}
