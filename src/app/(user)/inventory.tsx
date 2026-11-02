import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { InventoryItem, inventoryProgress } from "../../domain";
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

const categories: InventoryItem["category"][] = [
  "goodie_bag",
  "door_gift",
  "hantaran",
  "other",
];
const statuses: InventoryItem["status"][] = [
  "needed",
  "ordered",
  "ready",
  "distributed",
];

export default function Inventory() {
  const { t } = useTranslation();
  const { event, addInventory, updateInventory, deleteInventory } =
    useAppState();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] =
    useState<InventoryItem["category"]>("goodie_bag");
  const [target, setTarget] = useState("1");
  const [completed, setCompleted] = useState("0");
  const [status, setStatus] = useState<InventoryItem["status"]>("needed");
  const [note, setNote] = useState("");
  if (!event) return null;
  const summary = inventoryProgress(event.inventory);
  const close = () => {
    setOpen(false);
    setEditing(null);
    setName("");
    setCategory("goodie_bag");
    setTarget("1");
    setCompleted("0");
    setStatus("needed");
    setNote("");
  };
  const edit = (item: InventoryItem) => {
    setEditing(item.id);
    setName(item.name);
    setCategory(item.category);
    setTarget(String(item.target));
    setCompleted(String(item.completed));
    setStatus(item.status);
    setNote(item.note || "");
    setOpen(true);
  };
  const save = () => {
    const targetValue = Number(target);
    const completedValue = Number(completed);
    if (
      !name.trim() ||
      !Number.isInteger(targetValue) ||
      targetValue < 0 ||
      !Number.isInteger(completedValue) ||
      completedValue < 0 ||
      completedValue > targetValue
    )
      return Alert.alert(t("inventoryInvalidQuantity"));
    const item = {
      name: name.trim(),
      category,
      target: targetValue,
      completed: completedValue,
      status,
      note: note.trim() || undefined,
    };
    if (editing) updateInventory(editing, item);
    else addInventory(item);
    close();
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("inventoryTitle")}</Title>
      <Card>
        <Text style={styles.label}>
          {summary.completed}/{summary.target}
        </Text>
        <Text style={styles.muted}>
          {t("inventoryProgress", { percent: summary.percent })}
        </Text>
      </Card>
      {!event.inventory.length ? (
        <Empty
          icon="🎁"
          text={t("inventoryEmpty")}
          action={t("inventoryAdd")}
          onPress={() => setOpen(true)}
        />
      ) : (
        event.inventory.map((item) => (
          <Pressable key={item.id} onPress={() => edit(item)}>
            <Card>
              <View style={styles.between}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{item.name}</Text>
                  <Text style={styles.muted}>
                    {t(`inventoryCategory_${item.category}`)} · {item.completed}
                    /{item.target} · {t(`inventoryStatus_${item.status}`)}
                  </Text>
                  {item.note ? (
                    <Text style={styles.muted}>{item.note}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={palette.maroon}
                />
              </View>
            </Card>
          </Pressable>
        ))
      )}
      <Button label={t("inventoryAdd")} onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <Screen>
          <Title>{editing ? t("inventoryEdit") : t("inventoryAdd")}</Title>
          <Field
            value={name}
            onChangeText={setName}
            placeholder={t("inventoryName")}
          />
          <Text style={styles.label}>{t("inventoryCategory")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categories.map((value) => (
              <Button
                key={value}
                label={t(`inventoryCategory_${value}`)}
                onPress={() => setCategory(value)}
                secondary={category !== value}
              />
            ))}
          </View>
          <Field
            value={target}
            onChangeText={setTarget}
            placeholder={t("inventoryTarget")}
            keyboardType="numeric"
          />
          <Field
            value={completed}
            onChangeText={setCompleted}
            placeholder={t("inventoryCompleted")}
            keyboardType="numeric"
          />
          <Text style={styles.label}>{t("status")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {statuses.map((value) => (
              <Button
                key={value}
                label={t(`inventoryStatus_${value}`)}
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
          <Button label={t("save")} onPress={save} />
          {editing ? (
            <Button
              label={t("delete")}
              onPress={() =>
                Alert.alert(t("deleteConfirm"), "", [
                  { text: t("cancel") },
                  {
                    text: t("delete"),
                    style: "destructive",
                    onPress: () => {
                      deleteInventory(editing);
                      close();
                    },
                  },
                ])
              }
              secondary
            />
          ) : null}
          <Button label={t("cancel")} onPress={close} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
