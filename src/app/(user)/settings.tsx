import * as Application from "expo-application";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { supportEmail as resolveSupportEmail } from "../../domain/support";
import { languageNames, languages, setLanguage } from "../../i18n";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Card, Chip, ListRow, palette, Screen, styles, Title } from "../../ui";

const PRIVACY_URL = "https://appmeraung.github.io/kendurikita/index.html";
const TERMS_URL = "https://appmeraung.github.io/kendurikita/terms.html";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { event } = useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const [languageOpen, setLanguageOpen] = useState(false);
  const supportNumber = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "");
  const supportEmail = resolveSupportEmail(process.env.EXPO_PUBLIC_SUPPORT_EMAIL);
  return (
    <Screen>
      <Title subtitle={t("settingsIntro")}>{t("settings")}</Title>
      <Card>
        <ListRow icon="notifications-outline" label={t("notificationSettings")} onPress={() => router.push("/(user)/notification-settings")} />
        <ListRow icon="language-outline" label={t("language")} value={languageNames[i18n.language as keyof typeof languageNames] || i18n.language} onPress={() => setLanguageOpen((open) => !open)} />
        {languageOpen ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 }}>
            {languages.map((lang) => <Chip key={lang} label={languageNames[lang]} active={i18n.language === lang} onPress={() => void setLanguage(lang)} />)}
          </View>
        ) : null}
        <ListRow icon="shield-checkmark-outline" label={t("privacyPolicy")} onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <ListRow icon="document-text-outline" label={t("terms")} onPress={() => void Linking.openURL(TERMS_URL)} />
        <ListRow icon="help-circle-outline" label={t("help")} onPress={() => router.push("/(user)/help")} />
        <ListRow icon="play-circle-outline" label={t("replayTutorial")} onPress={() => router.push("/(user)/help")} />
        {supportNumber ? <ListRow icon="logo-whatsapp" label={plan === "premium" ? t("prioritySupport") : t("supportWhatsApp")} onPress={() => void Linking.openURL(`https://wa.me/${supportNumber}`)} /> : null}
        {supportEmail ? <ListRow icon="mail-outline" label={t("supportEmail")} onPress={() => void Linking.openURL(`mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent("KenduriKita support")}`)} /> : null}
        <View style={[styles.row, { paddingVertical: 12 }]}>
          <Ionicons name="information-circle-outline" size={20} color={palette.maroon} />
          <Text style={[styles.label, { flex: 1 }]}>{t("aboutApp")}</Text>
          <Text style={styles.muted}>KenduriKita {Application.nativeApplicationVersion ?? ""}</Text>
        </View>
      </Card>
    </Screen>
  );
}
