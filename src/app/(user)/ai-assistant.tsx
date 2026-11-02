import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { aiKinds, AiKind, validAiPrompt } from "../../domain/aiAssistant";
import { planAllows } from "../../domain/plans";
import { Language } from "../../i18n";
import { generateAiContent } from "../../services/aiAssistant";
import { resolveUserPlan } from "../../services/plans";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

export default function AiAssistant() {
  const { t, i18n } = useTranslation();
  const [plan, setPlan] = useState<"basic" | "pro" | "premium">("basic");
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<AiKind>("invitation");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [usage, setUsage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void resolveUserPlan()
      .then(setPlan)
      .finally(() => setReady(true));
  }, []);
  if (!ready) return null;
  if (!planAllows(plan, "premium"))
    return (
      <Screen>
        <Title>{t("aiAssistant")}</Title>
        <Card>
          <Text style={styles.muted}>{t("premiumFeatureRequired")}</Text>
          <Button
            label={t("viewPackages")}
            onPress={() => router.push("/(user)/paywall")}
          />
        </Card>
      </Screen>
    );
  const generate = async () => {
    if (!validAiPrompt(prompt)) return Alert.alert(t("aiPromptInvalid"));
    setBusy(true);
    try {
      const response = await generateAiContent(
        prompt.trim(),
        kind,
        i18n.language.split("-")[0] as Language,
      );
      setResult(response.content);
      setUsage(`${response.used}/${response.limit}`);
    } catch (error) {
      Alert.alert(
        t("aiGenerateFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Title>{t("aiAssistant")}</Title>
      <Text style={styles.muted}>{t("aiPrivacyNote")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {aiKinds.map((value) => (
          <Button
            key={value}
            label={t(`aiKind_${value}`)}
            onPress={() => setKind(value)}
            secondary={kind !== value}
          />
        ))}
      </View>
      <Field
        value={prompt}
        onChangeText={setPrompt}
        placeholder={t("aiPrompt")}
        multiline
        maxLength={2000}
      />
      <Button
        label={busy ? t("loading") : t("aiGenerate")}
        onPress={() => void generate()}
        disabled={busy}
      />
      {result ? (
        <Card>
          <Text style={styles.label}>{t("aiGeneratedLabel")}</Text>
          <Text style={styles.muted}>{result}</Text>
          <Text style={styles.muted}>{t("aiUsage", { usage })}</Text>
          <Button
            label={t("share")}
            onPress={() => void Share.share({ message: result })}
            secondary
          />
        </Card>
      ) : null}
    </Screen>
  );
}
