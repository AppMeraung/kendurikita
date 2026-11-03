import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { passwordAuthError } from "../../domain/passwordAuth";
import { saveNewPassword, startPasswordRecovery } from "../../services/supabase";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

export default function ResetPassword() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [error, setError] = useState(
    params.error_description || (params.code ? "" : t("resetLinkInvalid")),
  );
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  // React Native Web has no Alert dialog, so the message is also shown on screen.
  const say = (title: string, body?: string) => {
    setNotice(body ? `${title} — ${body}` : title);
    Alert.alert(title, body);
  };
  useEffect(() => {
    if (error || !params.code) return;
    void startPasswordRecovery(params.code).then(({ error: cause }) =>
      cause ? setError(cause.message) : setReady(true),
    );
  }, [error, params.code]);
  const save = async () => {
    const problem = passwordAuthError("newPassword", { email: "", password, confirm });
    if (problem) return say(t("signInFailed"), t(problem));
    setBusy(true);
    const { error: cause } = await saveNewPassword(password);
    setBusy(false);
    if (cause) return say(t("signInFailed"), cause.message);
    say(t("passwordUpdated"));
    router.replace("/(auth)/setup");
  };
  return (
    <Screen>
      <Title>{t("setNewPassword")}</Title>
      {notice ? <Text accessibilityRole="alert" style={styles.muted}>{notice}</Text> : null}
      {error || !ready ? (
        <Card>
          <Text style={error ? styles.danger : styles.muted}>
            {error || t("completingSignIn")}
          </Text>
        </Card>
      ) : (
        <>
          <Field
            value={password}
            onChangeText={setPassword}
            placeholder={t("newPassword")}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            accessibilityLabel={t("newPassword")}
          />
          <Field
            value={confirm}
            onChangeText={setConfirm}
            placeholder={t("confirmPassword")}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            accessibilityLabel={t("confirmPassword")}
          />
          <Button label={t("savePassword")} onPress={() => void save()} disabled={busy} />
        </>
      )}
    </Screen>
  );
}
