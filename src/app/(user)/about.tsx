import Ionicons from "@expo/vector-icons/Ionicons";
import * as Application from "expo-application";
import { router } from "expo-router";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ornament } from "../../components/Floral";
import { Card, ListRow, palette, Screen, serif, styles } from "../../ui";

export default function About() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="arrow-back" size={26} color={palette.maroon} />
      </Pressable>
      <View style={{ alignItems: "center", gap: 8 }}>
        <Image source={require("../../../assets/icon.png")} style={{ width: 88, height: 88, borderRadius: 22 }} accessibilityIgnoresInvertColors />
        <Text style={{ fontFamily: serif, fontSize: 28, fontWeight: "700", color: palette.maroon }}>KenduriKita</Text>
        <Ornament />
        <Text style={styles.muted}>{t("aboutVersion", { version: Application.nativeApplicationVersion ?? "web" })}</Text>
      </View>
      <Card>
        <Text style={[styles.muted, { fontSize: 15, lineHeight: 23 }]}>{t("aboutBody")}</Text>
      </Card>
      <Card>
        <ListRow icon="globe-outline" label="kendurikita.com" onPress={() => void Linking.openURL("https://kendurikita.com")} />
        <ListRow icon="mail-outline" label="support@kendurikita.com" onPress={() => void Linking.openURL("mailto:support@kendurikita.com")} />
        <ListRow icon="shield-checkmark-outline" label={t("privacyPolicy")} onPress={() => router.push("/legal/privacy")} />
        <ListRow icon="document-text-outline" label={t("terms")} onPress={() => router.push("/legal/terms")} />
      </Card>
      <Text style={[styles.muted, { textAlign: "center", fontSize: 12 }]}>© {new Date().getFullYear()} Meraung Studio</Text>
    </Screen>
  );
}
