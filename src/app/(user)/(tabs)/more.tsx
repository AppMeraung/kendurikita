import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Text, View } from "react-native";
import { ContextHelp } from "../../../components/Guidance";
import { useAppState } from "../../../state/AppState";
import { Card, ListRow, palette, Screen, serif, styles, Title } from "../../../ui";
import { cloudConfigured, supabase } from "../../../services/supabase";
import { syncEvent } from "../../../services/sync";
import { unregisterCurrentPushToken } from "../../../services/notifications";
import { logOutPurchaser } from "../../../services/revenuecat";
import { useUserPlan } from "../../../state/usePlan";
export default function More() {
  const { t } = useTranslation();
  const { event, updateEvent, reset } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const deleteAccount = () =>
    Alert.alert(
      t("deleteAccountConfirm"),
      t("deleteAccountDetail"),
      [
        { text: t("cancel") },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            if (cloudConfigured) {
              const { error } =
                await supabase.functions.invoke("delete-account");
              if (error) return Alert.alert(t("deleteAccountFailed"), error.message);
            }
            reset();
            router.replace("/(auth)/welcome");
          },
        },
      ],
    );
  const sync = async () => {
    if (!event) return;
    try {
      const cloudId = await syncEvent(event);
      updateEvent({ cloudId });
      Alert.alert(
        t("syncComplete"), t("syncCompleteDetail"),
      );
    } catch (error) {
      Alert.alert(
        t("syncFailed"), error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const signOut = async () => {
    try {
      await unregisterCurrentPushToken();
      await logOutPurchaser();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      reset();
      router.replace("/(auth)/welcome");
    } catch (error) {
      Alert.alert(t("signOutFailed"), error instanceof Error ? error.message : t("unknownError"));
    }
  };
  const go = (href: string) => () => router.push(href as never);
  return (
    <Screen>
      <View style={styles.between}>
        <Title subtitle={t("profileIntro")}>{t("profile")}</Title>
        <ContextHelp title={t("profile")} body={t("moreHelp")} />
      </View>
      <View style={{ alignItems: "center", gap: 6 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: palette.rose, borderWidth: 2, borderColor: palette.gold, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="people" size={40} color={palette.maroon} />
        </View>
        <Text style={{ fontFamily: serif, fontSize: 22, fontWeight: "700", color: palette.ink }}>{event?.name}</Text>
        {event?.date ? <View style={styles.row}><Ionicons name="calendar-outline" size={16} color={palette.gold} /><Text style={styles.muted}>{event.type} · {event.date}</Text></View> : null}
      </View>
      <Card>
        <ListRow icon="albums-outline" label={t("myEvents")} onPress={go("/(user)/events")} />
        <ListRow icon="people-circle-outline" label={t("team")} onPress={go("/(user)/team")} />
        <ListRow icon="diamond-outline" label={t("plans")} value={plan} onPress={go("/(user)/paywall")} />
        <ListRow icon="cloud-upload-outline" label={t("syncToAccount")} onPress={() => void sync()} />
        <ListRow icon="settings-outline" label={t("settings")} onPress={go("/(user)/settings")} />
      </Card>
      <Text style={[styles.label, { color: palette.gold }]}>{t("moreTools")}</Text>
      <Card>
        <ListRow icon="card-outline" label={t("payments")} onPress={go("/(user)/payments")} />
        <ListRow icon="folder-outline" label={t("documents")} onPress={go("/(user)/documents")} />
        <ListRow icon="cube-outline" label={t("inventory")} onPress={go("/(user)/inventory")} />
        <ListRow icon="bar-chart-outline" label={t("reports")} onPress={go("/(user)/reports")} />
        <ListRow icon="qr-code-outline" label={t("qrCheckIn")} onPress={go("/(user)/check-in")} />
        <ListRow icon="sunny-outline" label={t("dayMode")} onPress={go("/(user)/day-mode")} />
        <ListRow icon="calculator-outline" label={t("planningTools")} onPress={go("/(user)/extras")} />
        <ListRow icon="home-outline" label={t("parentBudget")} onPress={go("/(user)/parent-budget")} />
        <ListRow icon="sparkles-outline" label={t("aiAssistant")} onPress={go("/(user)/ai-assistant")} />
        <ListRow icon="ribbon-outline" label={t("postEvent")} onPress={go("/(user)/post-event")} />
        <ListRow icon="share-social-outline" label={t("referralProgramme")} onPress={go("/referrals")} />
      </Card>
      <Text style={[styles.label, { color: palette.gold }]}>{t("account")}</Text>
      <Card>
        <ListRow icon="log-out-outline" label={t("signOut")} onPress={() => void signOut()} />
        <ListRow icon="refresh-outline" label={t("resetLocalEvent")} onPress={() => { reset(); router.replace("/(auth)/setup"); }} />
        <ListRow icon="trash-outline" label={t("deleteAccount")} onPress={deleteAccount} danger />
      </Card>
    </Screen>
  );
}
