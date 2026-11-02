import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { supabase } from "../../services/supabase";
import { Card, Empty, palette, Screen, styles, Title } from "../../ui";

type Notice = { id: string; title: string; body: string; deep_link: string | null; read_at: string | null; created_at: string };
export default function NotificationInbox() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ["notifications"], queryFn: async () => {
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data as Notice[];
  }});
  const mark = async (item: Notice) => {
    if (!item.read_at) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", item.id);
    if (item.deep_link) router.push(item.deep_link as never);
    void query.refetch();
  };
  return <Screen>
    <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color={palette.maroon} /></Pressable>
    <View style={styles.between}><Title>{t("notifications")}</Title><Pressable accessibilityRole="button" accessibilityLabel={t("markAllRead")} onPress={async () => { await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null); void query.refetch(); }}><Text style={styles.label}>{t("markAllRead")}</Text></Pressable></View>
    {query.data?.length ? query.data.map((item) => <Pressable key={item.id} accessibilityLabel={`${t("open")}: ${item.title}`} onPress={() => void mark(item)}><Card><Text style={[styles.label, !item.read_at && { color: palette.maroon }]}>{item.title}</Text><Text style={styles.muted}>{item.body}</Text></Card></Pressable>) : <Empty icon="🔔" text={t("emptyNotifications")} action={t("refresh")} onPress={() => void query.refetch()} />}
  </Screen>;
}
