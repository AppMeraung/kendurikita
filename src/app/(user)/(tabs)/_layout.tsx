import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '../../../ui';

export default function TabLayout() {
  const { t } = useTranslation();
  const tab = (title: string, icon: keyof typeof Ionicons.glyphMap) => ({ title, tabBarAccessibilityLabel: title, tabBarIcon: ({ color, size }: { color: unknown; size: number }) => <Ionicons name={icon} color={String(color)} size={size} /> });
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.maroon, tabBarInactiveTintColor: palette.muted, tabBarStyle: { minHeight: 66, paddingBottom: 8, paddingTop: 6 } }}>
    <Tabs.Screen name="index" options={tab(t('home'), 'home-outline')} />
    <Tabs.Screen name="vendors" options={tab(t('vendors'), 'storefront-outline')} />
    <Tabs.Screen name="guests" options={tab(t('guests'), 'people-outline')} />
    <Tabs.Screen name="budget" options={tab(t('budget'), 'wallet-outline')} />
    <Tabs.Screen name="more" options={tab(t('more'), 'ellipsis-horizontal-circle-outline')} />
  </Tabs>;
}
