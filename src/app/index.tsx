import { Redirect } from 'expo-router';
import { useAppState } from '../state/AppState';
export default function Index() { const { toured, event } = useAppState(); if (!toured) return <Redirect href="/(auth)/welcome" />; if (!event) return <Redirect href="/(auth)/setup" />; return <Redirect href="/(user)/(tabs)" />; }
