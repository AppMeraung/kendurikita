import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { restoreLanguage } from "../i18n";
import { AppStateProvider, useAppState } from "../state/AppState";
import { QueryProvider } from "../services/query";
import { updateEventWidget } from "../services/widget";
import { identifyPurchaser } from "../services/revenuecat";
import { cloudConfigured, supabase } from "../services/supabase";
import { configureNotificationChannels } from "../services/notifications";
import { palette } from "../ui";

function Routes() {
  const { ready, event } = useAppState();
  useEffect(() => {
    void restoreLanguage();
    if (!cloudConfigured) {
      void identifyPurchaser();
      return;
    }
    void supabase.auth.getUser().then(({ data }) => identifyPurchaser(data.user?.id));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void identifyPurchaser(session?.user.id);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (Platform.OS === "web") return;
    void configureNotificationChannels();
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === "string" && url.startsWith("kendurikita://"))
        router.push(`/${url.slice("kendurikita://".length)}` as never);
    };
    void Notifications.getLastNotificationResponseAsync().then(open);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (ready) void updateEventWidget(event);
  }, [event, ready]);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.cream,
        }}
      >
        <ActivityIndicator color={palette.maroon} />
      </View>
    );
  return <Stack screenOptions={{ headerShown: false }} />;
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <AppStateProvider>
          <Routes />
        </AppStateProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
