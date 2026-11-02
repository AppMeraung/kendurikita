import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { loadCloudEvent } from "../../services/sync";
import { cloudConfigured, supabase } from "../../services/supabase";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Button, Card, Empty, Screen, styles, Title } from "../../ui";

type Row = { id: string; name: string; event_type: string; event_dates: string[] };
export default function Events() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const { event, replaceEvent } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  useEffect(() => {
    if (cloudConfigured) void supabase.from("events").select("id,name,event_type,event_dates").order("created_at").then(({ data }) => setRows(data || []));
  }, []);
  const open = async (id: string) => {
    try { replaceEvent(await loadCloudEvent(id)); router.replace("/(user)/(tabs)"); }
    catch (error) { Alert.alert(t("openEventFailed"), error instanceof Error ? error.message : t("unknownError")); }
  };
  const create = () => {
    if (event && !event.cloudId) return Alert.alert(t("syncCurrentEventFirst"));
    const limit = plan === "premium" ? 3 : 1;
    if (rows.length >= limit) return Alert.alert(t("eventLimitReached"), t("eventLimitPlan", { count: limit }));
    router.push("/(auth)/setup");
  };
  return <Screen>
    <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}><Text style={styles.label}>‹ {t("back")}</Text></Pressable>
    <Title>{t("myEvents")}</Title>
    <Button label={t("createAnotherEvent")} onPress={create} />
    {rows.length ? rows.map((item) => <Pressable key={item.id} accessibilityLabel={`${t("open")} ${item.name}`} onPress={() => void open(item.id)}><Card><Text style={styles.label}>{item.name}</Text><Text style={styles.muted}>{item.event_type} · {item.event_dates?.[0] || t("noDate")}</Text></Card></Pressable>) : <Empty icon="🗓️" text={t("emptyCloudEvents")} action={t("back")} onPress={() => router.back()} />}
  </Screen>;
}
