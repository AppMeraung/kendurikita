import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, Text } from "react-native";
import { languageNames, languages, setLanguage } from "../../../i18n";
import { useAppState } from "../../../state/AppState";
import { Button, Card, Screen, styles, Title } from "../../../ui";
import { cloudConfigured, supabase } from "../../../services/supabase";
import { syncEvent } from "../../../services/sync";
import { unregisterCurrentPushToken } from "../../../services/notifications";
import { logOutPurchaser } from "../../../services/revenuecat";
import { useUserPlan } from "../../../state/usePlan";
export default function More() {
  const { t } = useTranslation();
  const { event, updateEvent, reset } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const supportNumber = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "");
  const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim();
  const modules = [
    ["invite", t("invitation")], ["rsvp", "RSVP"], ["seating", t("seatingPlan")],
    ["schedule", t("schedule")], ["team", t("team")], ["payments", t("payments")],
    ["documents", t("documents")], ["items", t("inventory")], ["reports", t("reports")],
    ["postevent", t("postEvent")],
  ];
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
  return (
    <Screen>
      <Title>{t("more")}</Title>
      <Card>
        {modules.map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() =>
              router.push(
                key === "schedule"
                  ? "/(user)/schedule"
                  : key === "invite"
                    ? "/(user)/invitation"
                    : key === "rsvp"
                      ? "/(user)/(tabs)/guests"
                    : key === "team"
                      ? "/(user)/team"
                      : key === "seating"
                        ? "/(user)/seating"
                        : key === "items"
                          ? "/(user)/inventory"
                          : key === "documents"
                            ? "/(user)/documents"
                            : key === "payments"
                              ? "/(user)/payments"
                              : key === "reports"
                                ? "/(user)/reports"
                                : key === "postevent"
                                  ? "/(user)/post-event"
                                  : `/(user)/module/${key}`,
              )
            }
          >
            <Text style={[styles.label, { paddingVertical: 10 }]}>
              {label} ›
            </Text>
          </Pressable>
        ))}
      </Card>
      <Card>
        <Button
          label={t("myEvents")}
          onPress={() => router.push("/(user)/events")}
          secondary
        />
        <Button label={t("syncToAccount")} onPress={() => void sync()} secondary />
        <Button
          label={t("qrCheckIn")}
          onPress={() => router.push("/(user)/check-in")}
          secondary
        />
        <Button
          label={t("help")}
          onPress={() => router.push("/(user)/help")}
          secondary
        />
        <Button label={t("replayTutorial")} onPress={() => router.push("/(auth)/welcome")} secondary />
        <Button label={t("notificationSettings")} onPress={() => router.push("/(user)/notification-settings")} secondary />
        <Button
          label={t("plans")}
          onPress={() => router.push("/(user)/paywall")}
          secondary
        />
        <Button
          label={t("planningTools")}
          onPress={() => router.push("/(user)/extras")}
          secondary
        />
        <Button
          label={t("dayMode")}
          onPress={() => router.push("/(user)/day-mode")}
          secondary
        />
        <Button
          label={t("parentBudget")}
          onPress={() => router.push("/(user)/parent-budget")}
          secondary
        />
        <Button
          label={t("aiAssistant")}
          onPress={() => router.push("/(user)/ai-assistant")}
          secondary
        />
        <Button
          label={t("referralProgramme")}
          onPress={() => router.push("/referrals")}
          secondary
        />
        {supportNumber ? <Button label={plan === "premium" ? t("prioritySupport") : t("supportWhatsApp")} onPress={() => void Linking.openURL(`https://wa.me/${supportNumber}`)} secondary /> : null}
        {supportEmail ? <Button label={t("supportEmail")} onPress={() => void Linking.openURL(`mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent("KenduriKita support")}`)} secondary /> : null}
      </Card>
      <Card>
        <Text style={styles.label}>{t("language")}</Text>
        {languages.map((lang) => (
          <Button
            key={lang}
            label={languageNames[lang]}
            onPress={() => void setLanguage(lang)}
            secondary
          />
        ))}
      </Card>
      <Card>
        <Text style={styles.label}>KenduriKita 2.0.0</Text>
        <Text style={styles.muted}>{event?.name}</Text>
      </Card>
      <Button
        label={t("resetLocalEvent")}
        onPress={() => {
          reset();
          router.replace("/(auth)/setup");
        }}
        secondary
      />
      <Button label={t("deleteAccount")} onPress={deleteAccount} secondary />
      <Button label={t("signOut")} onPress={() => void signOut()} secondary />
    </Screen>
  );
}
