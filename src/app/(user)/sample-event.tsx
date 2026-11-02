import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, palette, Screen, styles, Title } from "../../ui";

export default function SampleEvent() {
  const { t } = useTranslation();
  return <Screen>
    <View style={styles.between}>
      <Text style={{ color: palette.white, backgroundColor: palette.maroon, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, fontWeight: "900" }}>{t("sampleLabel")}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("closeSample")} onPress={() => router.back()}><Text style={styles.label}>× {t("close")}</Text></Pressable>
    </View>
    <Title>Alya & Haziq</Title>
    <Card><Text style={styles.label}>{t("sampleOverview")}</Text><Text style={styles.metric}>{t("sampleDays", { count: 120 })}</Text><Text style={styles.muted}>12 Disember 2027 · Shah Alam</Text></Card>
    <Card><Text style={styles.label}>{t("budget")}</Text><Text style={styles.metric}>RM 8,500 / RM 30,000</Text><Text style={styles.muted}>{t("sampleBudgetNote")}</Text></Card>
    <Card><Text style={styles.label}>{t("guests")}</Text><Text style={styles.metric}>180 / 350 pax</Text><Text style={styles.muted}>{t("sampleGuestNote")}</Text></Card>
    <Card><Text style={styles.label}>{t("checklist")}</Text><Text style={styles.muted}>✓ {t("sampleTaskOne")}\n○ {t("sampleTaskTwo")}\n○ {t("sampleTaskThree")}</Text></Card>
    <Text style={styles.muted}>{t("sampleReadOnlyNotice")}</Text>
  </Screen>;
}
