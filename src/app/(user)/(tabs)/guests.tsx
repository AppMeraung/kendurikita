import Ionicons from "@expo/vector-icons/Ionicons";
import { Contact } from "expo-contacts";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Guest, validAmount } from "../../../domain";
import { userCanAdd } from "../../../domain/entitlements";
import { parseGuestCsv } from "../../../domain/guestCsv";
import { useAppState } from "../../../state/AppState";
import { useUserPlan } from "../../../state/usePlan";
import { ContextHelp } from "../../../components/Guidance";
import {
  Button,
  Card,
  Empty,
  Field,
  palette,
  Screen,
  styles,
  Title,
} from "../../../ui";

type Filter = "Semua" | Guest["rsvp"];

export default function Guests() {
  const { t } = useTranslation();
  const { event, addGuest, addGuests, updateGuest, deleteGuest } =
    useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [pax, setPax] = useState("1");
  const [group, setGroup] = useState("");
  const [rsvp, setRsvp] = useState<Guest["rsvp"]>("Menunggu");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Semua");
  const visible = useMemo(
    () =>
      event?.guests.filter(
        (guest) =>
          (filter === "Semua" || guest.rsvp === filter) &&
          `${guest.name} ${guest.group}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ) || [],
    [event?.guests, filter, query],
  );
  if (!event) return null;

  const clear = () => {
    setEditingId(null);
    setName("");
    setPax("1");
    setGroup("");
    setRsvp("Menunggu");
    setOpen(false);
  };
  const edit = (guest: Guest) => {
    setEditingId(guest.id);
    setName(guest.name);
    setPax(`${guest.pax}`);
    setGroup(guest.group);
    setRsvp(guest.rsvp);
    setOpen(true);
  };
  const submit = () => {
    if (!name.trim()) return Alert.alert(t("required"));
    if (!validAmount(pax) || Number(pax) < 1 || !Number.isInteger(Number(pax)))
      return Alert.alert(t("invalidNumber"));
    const existingPax = event.guests.reduce((sum, guest) => sum + guest.pax, 0);
    const oldPax = editingId
      ? event.guests.find((guest) => guest.id === editingId)?.pax || 0
      : 0;
    if (!userCanAdd(plan, "guests", existingPax - oldPax, Number(pax)))
      return Alert.alert(t("guestLimitReached"));
    const values = {
      name: name.trim(),
      pax: Number(pax),
      group: group.trim(),
      rsvp,
    };
    if (editingId) updateGuest(editingId, values);
    else addGuest(values);
    clear();
  };
  const importContact = async () => {
    try {
      const contact = await Contact.presentPicker();
      if (!contact) return;
      const contactName = await contact.getFullName();
      const existingPax = event.guests.reduce(
        (sum, guest) => sum + guest.pax,
        0,
      );
      if (!userCanAdd(plan, "guests", existingPax, 1))
        return Alert.alert(t("guestLimitReached"));
      addGuest({
        name: contactName || t("guestName"),
        pax: 1,
        group: t("contactGroup"),
        rsvp: "Menunggu",
      });
    } catch (error) {
      Alert.alert(
        t("contactImportFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const importCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "text/plain"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const imported = parseGuestCsv(
        await (await fetch(result.assets[0].uri)).text(),
      );
      if (!imported.length) return Alert.alert(t("noGuestsFound"));
      const existingPax = event.guests.reduce(
        (sum, guest) => sum + guest.pax,
        0,
      );
      const importedPax = imported.reduce((sum, guest) => sum + guest.pax, 0);
      if (!userCanAdd(plan, "guests", existingPax, importedPax))
        return Alert.alert(t("guestLimitReached"));
      addGuests(imported);
      Alert.alert(t("importComplete"), t("guestsImported", { count: imported.length }));
    } catch (error) {
      Alert.alert(
        t("csvImportFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };

  return (
    <Screen>
      <View style={styles.between}><Title>{t("guestTitle")}</Title><ContextHelp title={t("guestTitle")} body={t("guestsHelp")} /></View>
      <Field
        placeholder={t("searchGuests")}
        value={query}
        onChangeText={setQuery}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(["Semua", "Hadir", "Menunggu", "Tidak hadir"] as Filter[]).map(
          (item) => (
            <Button
              key={item}
              label={t(item === "Semua" ? "all" : item === "Hadir" ? "attending" : item === "Menunggu" ? "pending" : "notAttending")}
              onPress={() => setFilter(item)}
              secondary={filter !== item}
            />
          ),
        )}
      </View>
      {event.guests.length === 0 ? (
        <Empty
          icon="👥"
          text={t("emptyGuests")}
          action={t("firstGuest")}
          onPress={() => setOpen(true)}
        />
      ) : visible.length === 0 ? (
        <Empty
          icon="🔎"
          text={t("noMatchingGuests")}
          action={t("clearFilters")}
          onPress={() => {
            setQuery("");
            setFilter("Semua");
          }}
        />
      ) : (
        visible.map((guest) => (
          <Card key={guest.id}>
            <View style={styles.between}>
              <Pressable
                accessibilityLabel={`${t("edit")} ${guest.name}`}
                onPress={() => edit(guest)}
                style={{ flex: 1 }}
              >
                <Text style={styles.label}>{guest.name}</Text>
                <Text style={styles.muted}>
                  {guest.group || "—"} · {guest.pax} {t("pax")} · {t(guest.rsvp === "Hadir" ? "attending" : guest.rsvp === "Menunggu" ? "pending" : "notAttending")}
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
                      onPress: () => deleteGuest(guest.id),
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
      <Button label={t("addGuest")} onPress={() => setOpen(true)} />
      <Button
        label={t("importFromContacts")}
        onPress={() => void importContact()}
        secondary
      />
      <Button label={t("importCsv")} onPress={() => void importCsv()} secondary />
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>
            {editingId ? `${t("edit")} ${t("guestName")}` : t("addGuest")}
          </Title>
          <Field
            placeholder={t("guestName")}
            value={name}
            onChangeText={setName}
          />
          <Field placeholder={t("group")} value={group} onChangeText={setGroup} />
          <Field
            placeholder={t("pax")}
            value={pax}
            onChangeText={setPax}
            keyboardType="numeric"
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(["Hadir", "Menunggu", "Tidak hadir"] as Guest["rsvp"][]).map(
              (item) => (
                <Button
                  key={item}
                  label={t(item === "Hadir" ? "attending" : item === "Menunggu" ? "pending" : "notAttending")}
                  onPress={() => setRsvp(item)}
                  secondary={rsvp !== item}
                />
              ),
            )}
          </View>
          <Button label={t("save")} onPress={submit} />
          <Button label={t("cancel")} onPress={clear} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
