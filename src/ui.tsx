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
import { LinearGradient } from "expo-linear-gradient";
import { FloralCorner, Ornament } from "./components/Floral";

// Approximate tokens taken from the 16-screen reference image (not exported design values).
export const palette = {
  maroon: "#71162F",
  maroonDark: "#521022",
  gold: "#C9892F",
  cream: "#FFF9EC",
  ink: "#3A2228",
  muted: "#7D6A6F",
  line: "#E8D8C4",
  white: "#FFFDF8",
  rose: "#F2D9D2",
  danger: "#B42318",
  success: "#2E7D4F",
  warning: "#C98A24",
};
const buttonGradient = ["#A52C4D", "#6E142D"] as const;
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
      {subtitle ? <Text style={[styles.muted, { fontSize: 14 }]}>{subtitle}</Text> : null}
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
      <Text style={[styles.label, { textAlign: "center", fontWeight: "600" }]}>{label}</Text>
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
export function Field({ icon, right, ...props }: TextInputProps & { icon?: IconName; right?: ReactNode }) {
  if (!icon && !right) return <TextInput placeholderTextColor={palette.muted} {...props} style={[styles.field, props.style]} />;
  return (
    <View style={[styles.field, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
      {icon ? <Ionicons name={icon} size={18} color={palette.muted} /> : null}
      <TextInput placeholderTextColor={palette.muted} {...props} style={[{ flex: 1, minHeight: 46, color: palette.ink, fontSize: 16 }, props.style]} />
      {right}
    </View>
  );
}
/** Small selectable pill for filter rows that may wrap. */
export function Chip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={onPress} style={[styles.chip, active && { backgroundColor: palette.maroon, borderColor: palette.maroon }]}>
      {icon ? <Ionicons name={icon} size={14} color={active ? palette.white : palette.maroon} /> : null}
      <Text style={{ color: active ? palette.white : palette.ink, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
/** Thin rule with a centred word, e.g. "or". */
export function Divider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
      <Text style={styles.muted}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
    </View>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={18} color={secondary ? palette.maroon : palette.white} /> : null}
      <Text style={[styles.buttonText, secondary && { color: palette.maroon }]}>{label}</Text>
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [(pressed || disabled) && { opacity: 0.55 }]}
    >
      {secondary ? (
        <View style={[styles.button, styles.buttonSecondary]}>{content}</View>
      ) : (
        <LinearGradient colors={buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>{content}</LinearGradient>
      )}
    </Pressable>
  );
}
/** Search input with a leading magnifier icon. */
export function SearchField(props: TextInputProps) {
  return (
    <View style={[styles.field, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
      <Ionicons name="search-outline" size={18} color={palette.muted} />
      <TextInput placeholderTextColor={palette.muted} {...props} style={[{ flex: 1, minHeight: 46, color: palette.ink, fontSize: 15 }, props.style]} />
    </View>
  );
}
/** Pill segmented control (All / To Do / Done, Floor Plan / Guest List). */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={styles.segmented}>
      {options.map(([key, label]) => {
        const active = key === value;
        return (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={() => onChange(key)} style={{ flex: 1 }}>
            {active ? (
              <LinearGradient colors={buttonGradient} style={styles.segment}><Text style={[styles.segmentText, { color: palette.white }]}>{label}</Text></LinearGradient>
            ) : (
              <View style={styles.segment}><Text style={styles.segmentText}>{label}</Text></View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
type Tone = "success" | "warning" | "danger" | "neutral";
const toneColor = (tone: Tone) => (tone === "neutral" ? palette.muted : palette[tone]);
/** Small coloured status label, e.g. Attending / Pending / Not attending. */
export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const color = toneColor(tone);
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: `${color}1A` }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
/** Icon + big number + caption, used in stat rows (Guests, RSVP). */
export function Stat({ icon, value, label, tone = "neutral" }: { icon: IconName; value: string | number; label: string; tone?: Tone }) {
  const color = tone === "neutral" ? palette.maroon : toneColor(tone);
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={{ fontSize: 20, fontWeight: "800", color: palette.ink }}>{value}</Text>
      <Text style={[styles.muted, { fontSize: 12, textAlign: "center", lineHeight: 15 }]}>{label}</Text>
    </View>
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
  title: { fontFamily: serif, fontSize: 26, fontWeight: "700", color: palette.maroon },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white },
  segmented: { flexDirection: "row", gap: 6, padding: 4, borderRadius: 999, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line },
  segment: { minHeight: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  segmentText: { color: palette.ink, fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: "#6D1A33",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  listRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  tile: { flexBasis: "47%", flexGrow: 1, aspectRatio: 1.7, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 10, padding: 12 },
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
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
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
