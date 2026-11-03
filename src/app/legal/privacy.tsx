import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, palette, Screen, styles, Title } from "../../ui";

const privacy = {
  en: {
    title: "KenduriKita Privacy Policy",
    date: "Updated: 2 November 2026",
    body: "KenduriKita processes account details, event information, selected guest contacts, photos and documents, messages, RSVPs, purchases and notification tokens to provide the service. Contacts are never uploaded in bulk. Cloud data uses Supabase; digital purchases use Google Play or the App Store and RevenueCat. Data is not sold. Marketing is off by default. Export and account deletion are available in the app.",
    contact: "For privacy or support questions, contact support@kendurikita.com.",
  },
  ms: {
    title: "Polisi Privasi KenduriKita",
    date: "Dikemas kini: 2 November 2026",
    body: "KenduriKita memproses butiran akaun, maklumat majlis, kenalan tetamu yang dipilih, foto dan dokumen, mesej, RSVP, pembelian dan token notifikasi untuk menyediakan perkhidmatan. Kenalan tidak dimuat naik secara pukal. Data awan menggunakan Supabase; pembelian digital menggunakan Google Play atau App Store dan RevenueCat. Data tidak dijual. Promosi dimatikan secara lalai. Eksport dan pemadaman akaun tersedia dalam aplikasi.",
    contact: "Untuk pertanyaan privasi atau sokongan, hubungi support@kendurikita.com.",
  },
} as const;

export default function Privacy() {
  const { i18n, t } = useTranslation();
  const language = i18n.language.split("-")[0] === "ms" ? "ms" : "en";
  const content = privacy[language];
  return <Screen>
    <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={() => router.back()}><Text style={styles.label}>‹ {t("back")}</Text></Pressable>
    <View style={{ gap: 6 }}><Text style={{ color: palette.gold, fontWeight: "900" }}>KenduriKita</Text><Title>{content.title}</Title><Text style={styles.muted}>{content.date}</Text></View>
    <Card><Text style={styles.muted}>{content.body}</Text></Card>
    <Card><Text style={styles.label}>{language === "ms" ? "Hubungi kami" : "Contact us"}</Text><Text style={styles.muted}>{content.contact}</Text></Card>
    <Pressable accessibilityRole="link" accessibilityLabel={t("terms")} onPress={() => router.replace("/legal/terms")}><Text style={{ color: palette.maroon, fontWeight: "800", textAlign: "center" }}>{t("terms")} ›</Text></Pressable>
  </Screen>;
}
