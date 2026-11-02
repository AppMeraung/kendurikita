import { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const palette = {
  maroon: "#9C123C",
  gold: "#C59A45",
  cream: "#FFF8EC",
  ink: "#271A1E",
  muted: "#75676C",
  line: "#E9DADD",
  white: "#FFFFFF",
  rose: "#F9E7EC",
  danger: "#B42318",
};

export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }]}>{children}</View>
  );
  return <SafeAreaView style={styles.safe}>{body}</SafeAreaView>;
}
export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
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
  content: { padding: 20, paddingBottom: 110, gap: 16 },
  title: { fontSize: 28, fontWeight: "800", color: palette.maroon },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    color: palette.ink,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
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
