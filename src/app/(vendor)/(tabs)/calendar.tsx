import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Availability,
  availabilityConflict,
} from "../../../domain/vendorOperations";
import {
  deleteVendorAvailability,
  loadVendorAvailability,
  saveVendorAvailability,
} from "../../../services/vendorOperations";
import { Button, Card, Empty, Field, Screen, styles, Title } from "../../../ui";
type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: Availability["status"];
  note?: string;
};
const statuses: Availability["status"][] = ["available", "tentative", "booked"];
export default function Calendar() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Row[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string>();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState<Availability["status"]>("available");
  const [note, setNote] = useState("");
  const load = async () => {
    try {
      const result = await loadVendorAvailability();
      setVendorId(result.vendorId);
      setItems(result.items as Row[]);
    } catch (error) {
      Alert.alert(
        t("availabilityLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const clear = () => {
    setOpen(false);
    setEditing(undefined);
    setStart("");
    setEnd("");
    setStatus("available");
    setNote("");
  };
  const edit = (item: Row) => {
    setEditing(item.id);
    setStart(item.starts_at.slice(0, 16));
    setEnd(item.ends_at.slice(0, 16));
    setStatus(item.status);
    setNote(item.note || "");
    setOpen(true);
  };
  const save = async () => {
    const candidate = { id: editing, start, end, status };
    const existing = items.map((item) => ({
      id: item.id,
      start: item.starts_at,
      end: item.ends_at,
      status: item.status,
    }));
    if (availabilityConflict(candidate, existing))
      return Alert.alert(t("availabilityConflict"));
    try {
      await saveVendorAvailability(vendorId, editing, {
        starts_at: new Date(start).toISOString(),
        ends_at: new Date(end).toISOString(),
        status,
        note: note.trim() || null,
      });
      clear();
      await load();
    } catch (error) {
      Alert.alert(
        t("availabilitySaveFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("vendorCalendar")}</Title>
      {items.length ? (
        items.map((item) => (
          <Pressable key={item.id} accessibilityLabel={t("edit")} onPress={() => edit(item)}>
            <Card>
              <Text style={styles.label}>
                {t(`availabilityStatus_${item.status}`)}
              </Text>
              <Text style={styles.muted}>
                {item.starts_at.slice(0, 16).replace("T", " ")} →{" "}
                {item.ends_at.slice(0, 16).replace("T", " ")}
              </Text>
              {item.note ? <Text style={styles.muted}>{item.note}</Text> : null}
            </Card>
          </Pressable>
        ))
      ) : (
        <Empty
          icon="📅"
          text={t("availabilityEmpty")}
          action={t("availabilityAdd")}
          onPress={() => setOpen(true)}
        />
      )}
      <Button label={t("availabilityAdd")} onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>{t("availabilityAdd")}</Title>
          <Field
            value={start}
            onChangeText={setStart}
            placeholder={t("availabilityStart")}
          />
          <Field
            value={end}
            onChangeText={setEnd}
            placeholder={t("availabilityEnd")}
          />
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {statuses.map((value) => (
              <Button
                key={value}
                label={t(`availabilityStatus_${value}`)}
                onPress={() => setStatus(value)}
                secondary={status !== value}
              />
            ))}
          </View>
          <Field
            value={note}
            onChangeText={setNote}
            placeholder={t("note")}
            multiline
          />
          <Button label={t("save")} onPress={() => void save()} />
          {editing ? (
            <Button
              label={t("delete")}
              onPress={() =>
                void deleteVendorAvailability(editing)
                  .then(clear)
                  .then(load)
                  .catch((error) =>
                    Alert.alert(t("availabilitySaveFailed"), error.message),
                  )
              }
              secondary
            />
          ) : null}
          <Button label={t("cancel")} onPress={clear} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
