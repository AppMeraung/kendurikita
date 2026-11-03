import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { addNote, filterNotes, Note, parseNotes, removeNote } from "../../domain/notes";
import { useAppState } from "../../state/AppState";
import { Button, Card, Empty, Field, palette, Screen, styles, Title } from "../../ui";

const icons = ["bulb-outline", "people-outline", "bag-handle-outline"] as const;

export default function Notes() {
  const { t } = useTranslation();
  const { event } = useAppState();
  const key = `kendurikita.notes.${event?.id ?? "local"}`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  useEffect(() => {
    void AsyncStorage.getItem(key).then((raw) => { setNotes(parseNotes(raw)); setLoaded(true); });
  }, [key]);
  const save = (next: Note[]) => {
    setNotes(next);
    void AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => Alert.alert(t("saveFailed")));
  };
  const submit = () => {
    try {
      save(addNote(notes, { title, body }, new Date(), `${Date.now()}`));
      setTitle(""); setBody(""); setOpen(false);
    } catch {
      Alert.alert(t("noteTitle"));
    }
  };
  const confirmDelete = (note: Note) =>
    Alert.alert(t("delete"), note.title, [{ text: t("cancel") }, { text: t("delete"), style: "destructive", onPress: () => save(removeNote(notes, note.id)) }]);
  const shown = filterNotes(notes, query);
  return (
    <Screen>
      <Title subtitle={t("notesIntro")}>{t("notes")}</Title>
      <View style={[styles.row, styles.field, { gap: 8 }]}>
        <Ionicons name="search" size={18} color={palette.muted} />
        <Field value={query} onChangeText={setQuery} placeholder={t("searchNotes")} style={{ flex: 1, borderWidth: 0, paddingHorizontal: 0, minHeight: 44 }} />
      </View>
      {loaded && !notes.length ? <Empty icon="📝" text={t("emptyNotes")} action={t("addNote")} onPress={() => setOpen(true)} /> : null}
      {shown.map((note, index) => (
        <Pressable key={note.id} accessibilityLabel={note.title} onLongPress={() => confirmDelete(note)}>
          <Card>
            <View style={[styles.row, { alignItems: "flex-start" }]}>
              <Ionicons name={icons[index % icons.length]} size={22} color={palette.gold} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.label}>{note.title}</Text>
                {note.body ? <Text style={styles.muted} numberOfLines={2}>{note.body}</Text> : null}
                <Text style={[styles.muted, { fontSize: 12 }]}>{note.createdAt.slice(0, 10)}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t("delete")} onPress={() => confirmDelete(note)}>
                <Ionicons name="trash-outline" size={20} color={palette.muted} />
              </Pressable>
            </View>
          </Card>
        </Pressable>
      ))}
      {notes.length ? <Button label={`+ ${t("addNote")}`} onPress={() => setOpen(true)} /> : null}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Screen>
          <Title>{t("addNote")}</Title>
          <Field value={title} onChangeText={setTitle} placeholder={t("noteTitle")} />
          <Field value={body} onChangeText={setBody} placeholder={t("noteBody")} multiline style={{ minHeight: 120, textAlignVertical: "top", paddingTop: 12 }} />
          <Button label={t("save")} onPress={submit} disabled={!title.trim()} />
          <Button label={t("cancel")} onPress={() => setOpen(false)} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
