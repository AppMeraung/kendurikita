import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import en from "../../help/en/faq.json";
import id from "../../help/id/faq.json";
import ms from "../../help/ms/faq.json";
import ta from "../../help/ta/faq.json";
import zh from "../../help/zh/faq.json";
import { validHelpVideo } from "../../domain/help";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

const content = { ms, en, zh, ta, id };
const screenshots = [
  require("../../../store/screenshots/01-onboarding.png"),
  require("../../../store/screenshots/02-home-dashboard.png"),
  require("../../../store/screenshots/03-planning-tools.png"),
  require("../../../store/screenshots/04-guests-rsvp.png"),
];

export default function Help() {
  const { i18n, t } = useTranslation();
  const [query, setQuery] = useState("");
  const lang = i18n.language.split("-")[0] as keyof typeof content;
  const items = (content[lang] || content.ms).filter((item) =>
    `${item.title} ${item.body}`.toLowerCase().includes(query.toLowerCase()),
  );
  const videoUrl = process.env.EXPO_PUBLIC_HELP_VIDEO_URL || "";

  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Text style={styles.label}>‹ {t("back")}</Text>
      </Pressable>
      <Title>{t("help")}</Title>
      <Card>
        <Text style={styles.label}>{t("quickGuide")}</Text>
        <Text style={styles.muted}>{t("quickGuideBody")}</Text>
        <View style={{ gap: 8 }}>
          <Button label={`1. ${t("eventDate")}`} onPress={() => router.push("/(user)/events")} secondary />
          <Button label={`2. ${t("totalBudget")}`} onPress={() => router.push("/(user)/budget")} secondary />
          <Button label={`3. ${t("firstGuest")}`} onPress={() => router.push("/(user)/guests")} secondary />
          <Button label={`4. ${t("invitation")}`} onPress={() => router.push("/(user)/invitation")} secondary />
          <Button label={`5. ${t("vendors")}`} onPress={() => router.push("/(user)/(tabs)/vendors")} secondary />
        </View>
      </Card>
      <Button label={t("sampleEvent")} onPress={() => router.push("/(user)/sample-event")} secondary />
      <Field value={query} onChangeText={setQuery} placeholder={t("searchGuides")} />
      {items.map((item) => (
        <Card key={item.title}>
          <Text style={styles.label}>{item.title}</Text>
          <Text style={styles.muted}>{item.body}</Text>
        </Card>
      ))}
      <Title>{t("helpScreenshots")}</Title>
      {screenshots.map((source, index) => (
        <Image
          key={index}
          source={source}
          style={{ width: "100%", aspectRatio: 9 / 16, borderRadius: 18 }}
          contentFit="contain"
          accessibilityLabel={t("helpScreenshotLabel", { number: index + 1 })}
        />
      ))}
      <Title>{t("videoTutorial")}</Title>
      {validHelpVideo(videoUrl) ? (
        <Button label={t("watchVideoTutorial")} onPress={() => void Linking.openURL(videoUrl)} secondary />
      ) : (
        <Card>
          <Text style={styles.muted}>{t("videoTutorialUnavailable")}</Text>
        </Card>
      )}
    </Screen>
  );
}
