import { router } from "expo-router";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  AccountRole,
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "../../services/supabase";
import { Button, Divider, Field, palette, Screen, styles, Title } from "../../ui";
import { pendingEventInvitePath } from "../../services/eventInvites";
import { vendorAccessAllowed } from "../../domain/vendorAccess";
import { passwordAuthError, signUpOutcome, type PasswordMode } from "../../domain/passwordAuth";

export default function SignIn() {
  const { t } = useTranslation();
  const [role, setRole] = useState<AccountRole>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  // React Native Web has no Alert dialog, so the message is also shown on screen.
  const say = (title: string, body?: string) => {
    setNotice(body ? `${title} — ${body}` : title);
    Alert.alert(title, body);
  };
  const continueAfterSignIn = async () => {
    const pending = await pendingEventInvitePath();
    router.replace((pending || "/(auth)/setup") as never);
  };
  const continueAsGuest = async () => {
    if (await pendingEventInvitePath()) {
      say(t("inviteRequiresAccount"));
      return;
    }
    router.replace("/(auth)/setup");
  };
  const withPassword = async (action: PasswordMode) => {
    const problem = passwordAuthError(action, { email, password, confirm });
    if (problem) return say(t("signInFailed"), t(problem));
    setBusy(true);
    try {
      const address = email.trim();
      if (action === "reset") {
        const { error } = await sendPasswordReset(address);
        if (error) throw error;
        say(t("resetLinkSent"), t("resetLinkSentBody"));
      } else if (action === "signUp") {
        const { data, error } = await signUpWithPassword(address, password, role);
        if (error) throw error;
        const outcome = signUpOutcome(data);
        if (outcome === "signedIn") await continueAfterSignIn();
        else if (outcome === "existingAccount") {
          setMode("signIn");
          say(t("accountExistsTitle"), t("accountExistsBody"));
        } else say(t("checkEmail"), t("confirmEmailBody"));
      } else {
        const { error } = await signInWithPassword(address, password, role);
        if (error) throw error;
        await continueAfterSignIn();
      }
    } catch (error) {
      say(
        t("signInFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Title subtitle={t("signInWelcome")}>{t(mode === "signIn" ? "signIn" : "createAccount")}</Title>
      {notice ? <Text accessibilityRole="alert" style={styles.muted}>{notice}</Text> : null}
      {vendorAccessAllowed(Platform.OS) ? <><Text style={styles.muted}>{t("chooseRoleHint")}</Text>
      <View style={styles.row}>
        <Button
          label={t("coupleOrFamily")}
          onPress={() => setRole("user")}
          secondary={role !== "user"}
        />
        <Button
          label={t("vendorRole")}
          onPress={() => setRole("vendor")}
          secondary={role !== "vendor"}
        />
      </View> </> : null}
      <Field
        value={email}
        onChangeText={setEmail}
        placeholder={t("email")}
        icon="mail-outline"
        accessibilityLabel={t("email")}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        value={password}
        onChangeText={setPassword}
        placeholder={t("password")}
        icon="lock-closed-outline"
        right={<Pressable accessibilityRole="button" accessibilityLabel={t(showPassword ? "hidePassword" : "showPassword")} onPress={() => setShowPassword((v) => !v)} hitSlop={10}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={palette.muted} /></Pressable>}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete={mode === "signIn" ? "current-password" : "new-password"}
        accessibilityLabel={t("password")}
      />
      {mode === "signUp" ? (
        <Field
          value={confirm}
          onChangeText={setConfirm}
          placeholder={t("confirmPassword")}
          icon="lock-closed-outline"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          accessibilityLabel={t("confirmPassword")}
        />
      ) : null}
      {mode === "signIn" ? <Pressable accessibilityRole="button" accessibilityLabel={t("forgotPassword")} disabled={busy} onPress={() => void withPassword("reset")} style={{ alignSelf: "flex-end" }}><Text style={{ color: palette.maroon, fontWeight: "700" }}>{t("forgotPassword")}</Text></Pressable> : null}
      <Button
        label={t(mode === "signIn" ? "signInWithPassword" : "createAccount")}
        onPress={() => void withPassword(mode)}
        disabled={busy}
      />
      <Divider label={t("or")} />
      <Button
        icon={mode === "signIn" ? "person-add-outline" : "log-in-outline"}
        label={t(mode === "signIn" ? "noAccountSignUp" : "haveAccountSignIn")}
        onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        secondary
      />
      <Divider label={t("or")} />
      <Button
        label={t("guestMode")}
        onPress={() => void continueAsGuest()}
        secondary
      />
    </Screen>
  );
}
