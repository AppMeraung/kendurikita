import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  AccountRole,
  sendEmailOtp,
  sendPhoneOtp,
  signInWithProvider,
  verifyPhoneOtp,
} from "../../services/supabase";
import { Button, Field, Screen, styles, Title } from "../../ui";
import { pendingEventInvitePath } from "../../services/eventInvites";

export default function SignIn() {
  const { t } = useTranslation();
  const [role, setRole] = useState<AccountRole>("user");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const continueAfterSignIn = async () => {
    const pending = await pendingEventInvitePath();
    router.replace((pending || "/(auth)/setup") as never);
  };
  const continueAsGuest = async () => {
    if (await pendingEventInvitePath()) {
      Alert.alert(t("inviteRequiresAccount"));
      return;
    }
    router.replace("/(auth)/setup");
  };
  const otp = async (action: () => Promise<{ error: Error | null }>) => {
    try {
      const { error } = await action();
      if (error) throw error;
      Alert.alert(t("otpSent"), t("checkEmailOrPhone"));
    } catch (error) {
      Alert.alert(
        t("signInFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
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
      Alert.alert(
        t("signInFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("signIn")}</Title>
      <Text style={styles.muted}>{t("chooseRoleHint")}</Text>
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
      </View>
      <Field
        value={email}
        onChangeText={setEmail}
        placeholder="email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        label={t("sendMagicLink")}
        onPress={() => void otp(() => sendEmailOtp(email.trim(), role))}
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
                    ? Alert.alert(t("invalidOtp"), error.message)
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
