import { Redirect, Stack } from 'expo-router';
import { Platform } from 'react-native';
import { vendorAccessAllowed } from '../../domain/vendorAccess';
export default function VendorLayout() { if (!vendorAccessAllowed(Platform.OS)) return <Redirect href="/(user)/(tabs)" />; return <Stack screenOptions={{ headerShown: false }} />; }
