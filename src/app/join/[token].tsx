import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { acceptEventInvite, rememberPendingEventInvite } from "../../services/eventInvites";
import { loadCloudEvent } from "../../services/sync";
import { useAppState } from "../../state/AppState";
import { Button, Card, Screen, styles, Title } from "../../ui";

export default function JoinEvent() {
  const { t } = useTranslation();
  const { token = "" } = useLocalSearchParams<{ token: string }>();
  const { replaceEvent } = useAppState();
  const [busy, setBusy] = useState(false);
  useEffect(() => { void rememberPendingEventInvite(token); }, [token]);
  const join = async () => {
    setBusy(true);
    try {
      const eventId = await acceptEventInvite(token);
      replaceEvent(await loadCloudEvent(eventId));
      router.replace("/(user)/(tabs)");
    } catch (error) {
      Alert.alert(t("joinEventFailed"), error instanceof Error ? error.message : t("unknownError"));
    } finally { setBusy(false); }
  };
  return <Screen>
    <Title>{t("joinSharedEvent")}</Title>
    <Card><Text style={styles.muted}>{t("joinSharedEventDetail")}</Text></Card>
    <Button label={busy ? t("loading") : t("acceptEventInvite")} onPress={() => void join()} disabled={busy} />
    <Button label={t("signIn")} onPress={() => { void rememberPendingEventInvite(token).then(() => router.push("/(auth)/sign-in")); }} secondary />
  </Screen>;
}
