import * as Application from "expo-application";
import { router } from "expo-router";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { supportEmail as resolveSupportEmail } from "../../domain/support";
import { Language, languageNames, languages, setLanguage } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Card, ListPicker, ListRow, Screen, Title } from "../../ui";


export default function Settings() {
  const { t, i18n } = useTranslation();
  const { event } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const supportNumber = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "");
  const supportEmail = resolveSupportEmail(process.env.EXPO_PUBLIC_SUPPORT_EMAIL);
  return (
    <Screen>
      <Title subtitle={t("settingsIntro")}>{t("settings")}</Title>
      <Card>
        <ListRow icon="notifications-outline" label={t("notificationSettings")} onPress={() => router.push("/(user)/notification-settings")} />
        <ListRow icon="shield-checkmark-outline" label={t("privacyPolicy")} onPress={() => router.push("/legal/privacy")} />
        <ListRow icon="document-text-outline" label={t("terms")} onPress={() => router.push("/legal/terms")} />
        <ListRow icon="help-circle-outline" label={t("help")} onPress={() => router.push("/(user)/help")} />
        <ListRow icon="play-circle-outline" label={t("replayTutorial")} onPress={() => router.push("/(user)/help")} />
        {supportNumber ? <ListRow icon="logo-whatsapp" label={plan === "premium" ? t("prioritySupport") : t("supportWhatsApp")} onPress={() => void Linking.openURL(`https://wa.me/${supportNumber}`)} /> : null}
        {supportEmail ? <ListRow icon="mail-outline" label={t("supportEmail")} onPress={() => void Linking.openURL(`mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent("KenduriKita support")}`)} /> : null}
        <ListRow icon="information-circle-outline" label={t("aboutApp")} value={Application.nativeApplicationVersion ?? ""} onPress={() => router.push("/(user)/about")} />
      </Card>
      <ListPicker icon="language-outline" label={t("language")} value={i18n.language as Language} options={languages.map((lang) => [lang, languageNames[lang]] as const)} onChange={(lang) => void setLanguage(lang)} />
    </Screen>
  );
}
