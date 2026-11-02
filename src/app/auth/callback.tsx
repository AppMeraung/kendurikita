import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { completeOAuthCallback } from "../../services/supabase";
import { Card, Screen, styles, Title } from "../../ui";
import { pendingEventInvitePath } from "../../services/eventInvites";

export default function AuthCallback() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    code?: string;
    error_description?: string;
  }>();
  const [error, setError] = useState(params.error_description || "");
  useEffect(() => {
    if (!params.code || error) return;
    const url = `kendurikita://auth/callback?code=${encodeURIComponent(params.code)}`;
    void completeOAuthCallback(url)
      .then(async () => router.replace(((await pendingEventInvitePath()) || "/(auth)/setup") as never))
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : t("signInFailed")),
      );
  }, [error, params.code, t]);
  return (
    <Screen>
      <Title>{t("signIn")}</Title>
      <Card>
        <Text style={error ? styles.danger : styles.muted}>
          {error || t("completingSignIn")}
        </Text>
      </Card>
    </Screen>
  );
}
