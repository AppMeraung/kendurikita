import * as Application from "expo-application";
import { router } from "expo-router";
import { Linking, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { supportEmail as resolveSupportEmail } from "../../domain/support";
import { languageNames, languages, setLanguage } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Card, ListRow, palette, Screen, styles, Title } from "../../ui";

const PRIVACY_URL = "https://appmeraung.github.io/kendurikita/index.html";
const TERMS_URL = "https://appmeraung.github.io/kendurikita/terms.html";

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
        <ListRow icon="help-circle-outline" label={t("help")} onPress={() => router.push("/(user)/help")} />
        <ListRow icon="play-circle-outline" label={t("replayTutorial")} onPress={() => router.push("/(user)/help")} />
        {supportNumber ? <ListRow icon="logo-whatsapp" label={plan === "premium" ? t("prioritySupport") : t("supportWhatsApp")} onPress={() => void Linking.openURL(`https://wa.me/${supportNumber}`)} /> : null}
        {supportEmail ? <ListRow icon="mail-outline" label={t("supportEmail")} onPress={() => void Linking.openURL(`mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent("KenduriKita support")}`)} /> : null}
      </Card>
      <Text style={[styles.label, { color: palette.gold }]}>{t("language")}</Text>
      <Card>
        {languages.map((lang) => (
          <ListRow key={lang} icon={i18n.language === lang ? "radio-button-on" : "radio-button-off"} label={languageNames[lang]} onPress={() => void setLanguage(lang)} />
        ))}
      </Card>
      <Text style={[styles.label, { color: palette.gold }]}>{t("aboutApp")}</Text>
      <Card>
        <ListRow icon="shield-checkmark-outline" label={t("privacyPolicy")} onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <ListRow icon="document-text-outline" label={t("terms")} onPress={() => void Linking.openURL(TERMS_URL)} />
        <Text style={styles.muted}>KenduriKita {Application.nativeApplicationVersion ?? ""}</Text>
      </Card>
    </Screen>
  );
}
