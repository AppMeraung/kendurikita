import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  AccountRole,
  sendEmailOtp,
  sendPasswordReset,
  sendPhoneOtp,
  signInWithPassword,
  signInWithProvider,
  signUpWithPassword,
  verifyPhoneOtp,
} from "../../services/supabase";
import { Button, Field, Screen, styles, Title } from "../../ui";
import { pendingEventInvitePath } from "../../services/eventInvites";
import { vendorAccessAllowed } from "../../domain/vendorAccess";
import { passwordAuthError, type PasswordMode } from "../../domain/passwordAuth";

export default function SignIn() {
  const { t } = useTranslation();
  const [role, setRole] = useState<AccountRole>("user");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [busy, setBusy] = useState(false);
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
  const otp = async (action: () => Promise<{ error: Error | null }>) => {
    try {
      const { error } = await action();
      if (error) throw error;
      say(t("otpSent"), t("checkEmailOrPhone"));
    } catch (error) {
      say(
        t("signInFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
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
        if (data.session) await continueAfterSignIn();
        else say(t("checkEmail"), t("confirmEmailBody"));
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
  const social = async (provider: "google" | "apple") => {
    try {
      const { error } = await signInWithProvider(provider, role);
      if (error) throw error;
      await continueAfterSignIn();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("ERR_REQUEST_CANCELED")
      )
        return;
      say(
        t("signInFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("signIn")}</Title>
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
        placeholder="email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        value={password}
        onChangeText={setPassword}
        placeholder={t("password")}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={mode === "signIn" ? "current-password" : "new-password"}
        accessibilityLabel={t("password")}
      />
      {mode === "signUp" ? (
        <Field
          value={confirm}
          onChangeText={setConfirm}
          placeholder={t("confirmPassword")}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          accessibilityLabel={t("confirmPassword")}
        />
      ) : null}
      <Button
        label={t(mode === "signIn" ? "signInWithPassword" : "createAccount")}
        onPress={() => void withPassword(mode)}
        disabled={busy}
      />
      <View style={styles.row}>
        <Button
          label={t(mode === "signIn" ? "noAccountSignUp" : "haveAccountSignIn")}
          onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          secondary
        />
        <Button
          label={t("forgotPassword")}
          onPress={() => void withPassword("reset")}
          secondary
          disabled={busy}
        />
      </View>
      <Text style={styles.muted}>{t("orPasswordless")}</Text>
      <Button
        label={t("sendMagicLink")}
        onPress={() => void otp(() => sendEmailOtp(email.trim(), role))}
        secondary
      />
      <Field
        value={phone}
        onChangeText={setPhone}
        placeholder="+60123456789"
        keyboardType="phone-pad"
      />
      <Button
        label={t("sendPhoneOtp")}
        onPress={() =>
          void otp(async () => {
            const result = await sendPhoneOtp(phone.trim(), role);
            if (!result.error) setPhoneOtpSent(true);
            return result;
          })
        }
      />
      {phoneOtpSent ? (
        <>
          <Field
            value={phoneCode}
            onChangeText={setPhoneCode}
            placeholder={t("otpCode")}
            keyboardType="number-pad"
          />
          <Button
            label={t("verifyOtp")}
            onPress={() =>
              void verifyPhoneOtp(phone.trim(), phoneCode.trim(), role).then(
                ({ error }) =>
                  error
                    ? say(t("invalidOtp"), error.message)
                    : void continueAfterSignIn(),
              )
            }
          />
        </>
      ) : null}
      <Button label="Google" onPress={() => void social("google")} secondary />
      {Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ width: "100%", height: 48 }}
          onPress={() => void social("apple")}
        />
      ) : (
        <Button label="Apple" onPress={() => void social("apple")} secondary />
      )}
      <Button
        label={t("guestMode")}
        onPress={() => void continueAsGuest()}
        secondary
      />
    </Screen>
  );
}
