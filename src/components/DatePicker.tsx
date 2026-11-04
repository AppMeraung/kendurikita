import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { isoDay, monthCells } from "../domain/calendar";
import { palette, serif, styles } from "../ui";

/** Tap-to-pick month calendar; value and onChange use YYYY-MM-DD. Days before today are disabled. */
export function DatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { i18n } = useTranslation();
  const today = new Date();
  const todayIso = isoDay(today.getFullYear(), today.getMonth(), today.getDate());
  const start = value ? new Date(`${value}T12:00:00`) : today;
  const [year, setYear] = useState(start.getFullYear());
  const [month, setMonth] = useState(start.getMonth());
  const shift = (by: number) => {
    const next = new Date(year, month + by, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };
  const locale = i18n.language;
  // 2024-01-01 is a Monday, so these are Monday-first weekday initials in the current language.
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "narrow" }));
  const canGoBack = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
  return (
    <View style={[styles.card, { gap: 8 }]}>
      <View style={styles.between}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={!canGoBack} onPress={() => shift(-1)} hitSlop={10} style={{ opacity: canGoBack ? 1 : 0.3 }}>
          <Ionicons name="chevron-back" size={22} color={palette.maroon} />
        </Pressable>
        <Text style={{ fontFamily: serif, fontSize: 18, fontWeight: "700", color: palette.maroon }}>
          {new Date(year, month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shift(1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={22} color={palette.maroon} />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row" }}>
        {weekdays.map((day, i) => <Text key={i} style={[styles.muted, { flex: 1, textAlign: "center", fontSize: 12 }]}>{day}</Text>)}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {monthCells(year, month).map((day, i) => {
          if (!day) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const iso = isoDay(year, month, day);
          const selected = iso === value;
          const past = iso < todayIso;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: past }}
              accessibilityLabel={new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
              disabled={past}
              onPress={() => onChange(selected ? "" : iso)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: selected ? palette.maroon : "transparent", borderWidth: iso === todayIso && !selected ? 1 : 0, borderColor: palette.gold }}>
                <Text style={{ color: selected ? palette.white : past ? palette.line : palette.ink, fontWeight: selected ? "800" : "500" }}>{day}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
