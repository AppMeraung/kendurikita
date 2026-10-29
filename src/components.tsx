import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadow } from './theme';

export function ScreenHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <View style={styles.header}><View style={{ flex: 1 }}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View>{action}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'green' | 'maroon' | 'muted' }) {
  const map = { gold: ['#F6E8BF', '#8A6420'], green: ['#DDF1E7', colors.green], maroon: ['#F1DCE3', colors.maroon], muted: ['#EEEAE6', colors.muted] } as const;
  return <View style={[styles.pill, { backgroundColor: map[tone][0] }]}><Text style={[styles.pillText, { color: map[tone][1] }]}>{label}</Text></View>;
}

export function PrimaryButton({ label, onPress, light = false }: { label: string; onPress: () => void; light?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.button, light && styles.buttonLight, pressed && { opacity: 0.82 }]}><Text style={[styles.buttonText, light && { color: colors.maroon }]}>{label}</Text></Pressable>;
}

export function ProgressBar({ value, light = false }: { value: number; light?: boolean }) {
  return <View style={[styles.progressTrack, light && { backgroundColor: 'rgba(255,255,255,.22)' }]}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, value))}%` }, light && { backgroundColor: colors.goldLight }]} /></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  eyebrow: { color: colors.gold, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, marginBottom: 4 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line, ...shadow },
  pill: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '800' },
  button: { backgroundColor: colors.maroon, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonLight: { backgroundColor: colors.cream },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: 99, backgroundColor: colors.creamDeep, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: colors.maroon },
});
