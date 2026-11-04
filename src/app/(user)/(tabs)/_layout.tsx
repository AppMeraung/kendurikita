import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '../../../ui';

export default function TabLayout() {
  const { t } = useTranslation();
  const tab = (title: string, icon: keyof typeof Ionicons.glyphMap, active: keyof typeof Ionicons.glyphMap) => ({ title, tabBarAccessibilityLabel: title, tabBarIcon: ({ color, size, focused }: { color: unknown; size: number; focused: boolean }) => <Ionicons name={focused ? active : icon} color={String(color)} size={size} /> });
  return <Tabs screenOptions={{ headerShown: false, animation: 'shift', tabBarActiveTintColor: palette.maroon, tabBarInactiveTintColor: palette.muted, tabBarStyle: { minHeight: 72, paddingBottom: 10, paddingTop: 8, backgroundColor: palette.white, borderTopColor: palette.line }, tabBarLabelStyle: { fontWeight: '600', fontSize: 11 } }}>
    <Tabs.Screen name="index" options={tab(t('home'), 'home-outline', 'home')} />
    <Tabs.Screen name="planning" options={tab(t('planning'), 'calendar-outline', 'calendar')} />
    <Tabs.Screen name="vendors" options={tab(t('vendors'), 'storefront-outline', 'storefront')} />
    <Tabs.Screen name="more" options={tab(t('profile'), 'person-outline', 'person')} />
  </Tabs>;
}
