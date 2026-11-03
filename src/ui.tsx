import { ReactNode } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloralCorner, Ornament } from "./components/Floral";

export const palette = {
  maroon: "#7A1F3D",
  gold: "#B8892F",
  cream: "#FBF4EA",
  ink: "#3A2228",
  muted: "#7D6A6F",
  line: "#EEDFD3",
  white: "#FFFDF9",
  rose: "#F6E6E4",
  danger: "#B42318",
};
// shortcut: system serif, swap for a bundled display font (e.g. Playfair) if the look needs to match exactly.
export const serif = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, 'Times New Roman', serif" });

function BrandHeader() {
  return (
    <View style={styles.brandWrap} pointerEvents="none">
      <View style={styles.cornerLeft}><FloralCorner size={92} /></View>
      <View style={styles.cornerRight}><FloralCorner size={92} flip /></View>
      <Text style={styles.brand}>KenduriKita</Text>
      <Ornament />
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  brand = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  brand?: boolean;
}) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.content}>{brand ? <BrandHeader /> : null}{children}</ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }]}>{brand ? <BrandHeader /> : null}{children}</View>
  );
  return <SafeAreaView style={styles.safe}>{body}</SafeAreaView>;
}
export function Title({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.title}>{children}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}
type IconName = keyof typeof Ionicons.glyphMap;
/** Menu row: icon, label, optional value, chevron. */
export function ListRow({ icon, label, value, onPress, danger = false }: { icon: IconName; label: string; value?: string; onPress: () => void; danger?: boolean }) {
  const color = danger ? palette.danger : palette.maroon;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.label, { flex: 1 }, danger && { color }]}>{label}</Text>
      {value ? <Text style={styles.muted}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={palette.muted} />
    </Pressable>
  );
}
/** Square shortcut tile for icon grids (Planning hub, Home). */
export function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={30} color={palette.maroon} />
      <Text style={[styles.label, { textAlign: "center" }]}>{label}</Text>
    </Pressable>
  );
}
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={palette.muted}
      {...props}
      style={[styles.field, props.style]}
    />
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        (pressed || disabled) && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: palette.maroon }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Empty({
  icon,
  text,
  action,
  onPress,
}: {
  icon: string;
  text: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Card>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>{icon}</Text>
        <Text style={styles.emptyText}>{text}</Text>
        <Button label={action} onPress={onPress} />
      </View>
    </Card>
  );
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  content: { padding: 20, paddingTop: 8, paddingBottom: 110, gap: 16 },
  brandWrap: { alignItems: "center", gap: 4, paddingTop: 14, paddingBottom: 4, marginHorizontal: -20 },
  cornerLeft: { position: "absolute", left: -6, top: -14 },
  cornerRight: { position: "absolute", right: -6, top: -14 },
  brand: { fontFamily: serif, fontSize: 26, color: palette.maroon, fontWeight: "600", letterSpacing: 0.3 },
  title: { fontFamily: serif, fontSize: 28, fontWeight: "700", color: palette.maroon },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#6D1A33",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  listRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  tile: { flexBasis: "47%", flexGrow: 1, aspectRatio: 1.6, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 10, padding: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: palette.line, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: palette.maroon },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    color: palette.ink,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: palette.maroon,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.maroon,
  },
  buttonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  empty: { alignItems: "center", gap: 14, paddingVertical: 18 },
  emptyIcon: { fontSize: 42 },
  emptyText: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  label: { color: palette.ink, fontWeight: "700" },
  muted: { color: palette.muted, lineHeight: 21 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  between: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  metric: { fontSize: 22, color: palette.ink, fontWeight: "800" },
  danger: { color: palette.danger, fontWeight: "700" },
});
