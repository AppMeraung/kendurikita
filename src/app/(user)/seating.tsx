import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SeatingTable } from "../../domain";
import { userFeature } from "../../domain/entitlements";
import {
  canAssignTable,
  clampTablePosition,
  tableOccupancy,
} from "../../domain/seating";
import { shareSeatingPdf } from "../../services/seatingExport";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import {
  Button,
  Card,
  Empty,
  Field,
  palette,
  Screen,
  Segmented,
  styles,
  Title,
} from "../../ui";

function DraggableTable({
  table,
  occupied,
  planWidth,
  onMove,
  onOpen,
}: {
  table: SeatingTable;
  occupied: number;
  planWidth: number;
  onMove: (position: { x: number; y: number }) => void;
  onOpen: () => void;
}) {
  const [position] = useState(
    () => new Animated.ValueXY({ x: table.x, y: table.y }),
  );
  useEffect(() => {
    position.setValue({ x: table.x, y: table.y });
  }, [position, table.x, table.y]);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          position.setOffset({ x: table.x, y: table.y });
          position.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: position.x, dy: position.y }],
          { useNativeDriver: false },
        ),
        onPanResponderRelease: (_, gesture) => {
          position.flattenOffset();
          if (Math.abs(gesture.dx) + Math.abs(gesture.dy) < 5) return onOpen();
          const next = clampTablePosition(
            table.x + gesture.dx,
            table.y + gesture.dy,
            planWidth,
            460,
          );
          position.setValue(next);
          onMove(next);
        },
      }),
    [onMove, onOpen, planWidth, position, table.x, table.y],
  );
  return (
    <Animated.View
      {...responder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel={`${table.name}, ${occupied}/${table.capacity}`}
      style={{
        position: "absolute",
        transform: position.getTranslateTransform(),
        width: table.shape === "round" ? 76 : 136,
        height: table.shape === "round" ? 76 : undefined,
        minHeight: 72,
        borderRadius: table.shape === "round" ? 38 : 12,
        backgroundColor: palette.white,
        borderWidth: 2,
        borderColor:
          occupied > table.capacity ? palette.danger : palette.maroon,
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
      }}
    >
      {table.shape === "round"
        ? Array.from({ length: Math.min(table.capacity, 12) }, (_, seat) => {
            const angle = (seat / Math.min(table.capacity, 12)) * 2 * Math.PI - Math.PI / 2;
            return (
              <View
                key={seat}
                pointerEvents="none"
                style={{ position: "absolute", left: 38 + Math.cos(angle) * 46 - 6, top: 38 + Math.sin(angle) * 46 - 6, width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: palette.maroon, backgroundColor: seat < occupied ? palette.gold : palette.white }}
              />
            );
          })
        : null}
      <Text style={[styles.label, { color: palette.maroon }]} numberOfLines={1}>
        {table.name}
      </Text>
      <Text style={[styles.muted, { fontSize: 12 }]}>
        {occupied}/{table.capacity}
      </Text>
    </Animated.View>
  );
}

export default function Seating() {
  const { t } = useTranslation();
  const { event, addTable, updateTable, deleteTable, assignGuestTable } =
    useAppState();
  const { plan, loading } = useUserPlan(event?.cloudId);
  const [planWidth, setPlanWidth] = useState(320);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shape, setShape] = useState<SeatingTable["shape"]>("round");
  const [capacity, setCapacity] = useState("10");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"plan" | "list">("plan");
  if (!event) return null;
  if (loading) return null;
  if (!userFeature(plan, "seating"))
    return (
      <Screen>
        <Title>{t("seatingTitle")}</Title>
        <Card>
          <Text style={styles.muted}>{t("proFeatureRequired")}</Text>
          <Button
            label={t("viewPackages")}
            onPress={() => router.push("/(user)/paywall")}
          />
        </Card>
      </Screen>
    );
  const selected = event.seating.find((table) => table.id === selectedId);
  const clear = () => {
    setEditingId(null);
    setName("");
    setShape("round");
    setCapacity("10");
    setOpen(false);
  };
  const beginEdit = (table: SeatingTable) => {
    setEditingId(table.id);
    setName(table.name);
    setShape(table.shape);
    setCapacity(`${table.capacity}`);
    setSelectedId(null);
    setOpen(true);
  };
  const submit = () => {
    const parsed = Number(capacity);
    if (!name.trim() || !Number.isInteger(parsed) || parsed < 1)
      return Alert.alert(t("invalidNumber"));
    if (editingId && tableOccupancy(editingId, event.guests) > parsed)
      return Alert.alert(t("capacityExceeded"));
    const value = { name: name.trim(), shape, capacity: parsed };
    if (editingId) updateTable(editingId, value);
    else
      addTable({
        ...value,
        x: 12 + (event.seating.length % 3) * 105,
        y: 16 + Math.floor(event.seating.length / 3) * 90,
      });
    clear();
  };
  const toggleGuest = (guestId: string) => {
    if (!selected) return;
    const guest = event.guests.find((item) => item.id === guestId);
    if (!guest) return;
    if (guest.tableId === selected.id)
      return assignGuestTable(guest.id, undefined);
    if (!canAssignTable(selected, guest, event.guests))
      return Alert.alert(t("capacityExceeded"));
    assignGuestTable(guest.id, selected.id);
  };
  const exportPdf = async () => {
    try {
      await shareSeatingPdf(event.name, event.seating, event.guests);
    } catch (error) {
      Alert.alert(
        t("exportFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title subtitle={t("seatingIntro")}>{t("seatingTitle")}</Title>
      <Segmented options={[["plan", t("floorPlan")], ["list", t("guestList")]] as const} value={view} onChange={setView} />
      {view === "list" ? (
        <Card>
          {[...event.seating.map((table) => [table.id, table.name] as const), [undefined, t("unassigned")] as const].map(([tableId, label], index) => {
            const seated = event.guests.filter((guest) => guest.tableId === tableId);
            if (!tableId && !seated.length) return null;
            return (
              <View key={tableId || "none"} style={[{ gap: 4 }, index > 0 && { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 10 }]}>
                <View style={styles.between}><Text style={styles.label}>{label}</Text><Text style={styles.muted}>{seated.length}</Text></View>
                <Text style={[styles.muted, { fontSize: 13 }]}>{seated.map((guest) => guest.name).join(", ") || "—"}</Text>
              </View>
            );
          })}
        </Card>
      ) : null}
      {view === "plan" ? <Text style={styles.muted}>{t("dragTables")}</Text> : null}
      {view !== "plan" ? null : event.seating.length ? (
        <View
          onLayout={(layoutEvent) =>
            setPlanWidth(layoutEvent.nativeEvent.layout.width)
          }
          style={{
            height: 460,
            borderWidth: 1,
            borderColor: palette.line,
            borderRadius: 18,
            backgroundColor: palette.cream,
            overflow: "hidden",
          }}
        >
          {event.seating.map((table) => (
            <DraggableTable
              key={table.id}
              table={table}
              occupied={tableOccupancy(table.id, event.guests)}
              planWidth={planWidth}
              onMove={(position) => updateTable(table.id, position)}
              onOpen={() => setSelectedId(table.id)}
            />
          ))}
        </View>
      ) : (
        <Empty
          icon="🪑"
          text={t("emptySeating")}
          action={t("addTable")}
          onPress={() => setOpen(true)}
        />
      )}
      <Button icon="add" label={t("addTable")} onPress={() => setOpen(true)} />
      <Button
        icon="download-outline"
        label={t("exportSeating")}
        onPress={() => void exportPdf()}
        secondary
      />
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>{editingId ? t("editTable") : t("addTable")}</Title>
          <Field
            value={name}
            onChangeText={setName}
            placeholder={t("tableName")}
          />
          <Text style={styles.label}>{t("tableShape")}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label={t("roundTable")}
              onPress={() => setShape("round")}
              secondary={shape !== "round"}
            />
            <Button
              label={t("longTable")}
              onPress={() => setShape("long")}
              secondary={shape !== "long"}
            />
          </View>
          <Field
            value={capacity}
            onChangeText={setCapacity}
            placeholder={t("capacity")}
            keyboardType="numeric"
          />
          <Button label={t("save")} onPress={submit} />
          <Button label={t("cancel")} onPress={clear} secondary />
        </Screen>
      </Modal>
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelectedId(null)}
      >
        <Screen>
          <Title>{selected?.name}</Title>
          <Text style={styles.muted}>
            {t("occupancy")}:{" "}
            {selected ? tableOccupancy(selected.id, event.guests) : 0}/
            {selected?.capacity}
          </Text>
          <Button
            label={t("editTable")}
            onPress={() => selected && beginEdit(selected)}
            secondary
          />
          {event.guests.map((guest) => (
            <Button
              key={guest.id}
              label={`${guest.tableId === selected?.id ? "✓ " : ""}${guest.name} · ${guest.pax} pax${guest.tableId && guest.tableId !== selected?.id ? ` · ${event.seating.find((table) => table.id === guest.tableId)?.name || t("unassignedGuests")}` : ""}`}
              onPress={() => toggleGuest(guest.id)}
              secondary={guest.tableId !== selected?.id}
            />
          ))}
          {selected ? (
            <Button
              label={t("delete")}
              onPress={() =>
                Alert.alert(t("deleteConfirm"), "", [
                  { text: t("cancel") },
                  {
                    text: t("delete"),
                    style: "destructive",
                    onPress: () => {
                      deleteTable(selected.id);
                      setSelectedId(null);
                    },
                  },
                ])
              }
              secondary
            />
          ) : null}
          <Button
            label={t("cancel")}
            onPress={() => setSelectedId(null)}
            secondary
          />
        </Screen>
      </Modal>
    </Screen>
  );
}
