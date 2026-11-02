import { useEffect, useState } from "react";
import { Alert, Share, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { referralProgress, validReferralCode } from "../domain/referrals";
import { loadReferralDashboard, redeemReferral } from "../services/referrals";
import { Button, Card, Field, Screen, styles, Title } from "../ui";

type Referral = {
  id: string;
  kind: "user" | "vendor";
  status: string;
  reward?: string;
  created_at: string;
};
type Dashboard = {
  role: "user" | "vendor" | "admin";
  code: string;
  referrals: Referral[];
};

export default function Referrals() {
  const { t } = useTranslation();
  const [data, setData] = useState<Dashboard>();
  const [code, setCode] = useState("");
  const load = async () => {
    try {
      setData((await loadReferralDashboard()) as Dashboard);
    } catch (error) {
      Alert.alert(
        t("referralLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!data)
    return (
      <Screen>
        <Title>{t("referralProgramme")}</Title>
        <Text style={styles.muted}>{t("loading")}</Text>
      </Screen>
    );
  const kind = data.role === "vendor" ? "vendor" : "user";
  const active = data.referrals.filter(
    (item) =>
      item.kind === kind &&
      (item.status === "active" || item.status === "rewarded"),
  ).length;
  const progress = referralProgress(kind, active);
  const share = async () => {
    const base = process.env.EXPO_PUBLIC_WEB_URL || "https://kendurikita.app";
    await Share.share({
      message: t("referralShareMessage", {
        code: data.code,
        link: `${base}/referrals?code=${data.code}`,
      }),
    });
  };
  const redeem = async () => {
    if (!validReferralCode(code)) return Alert.alert(t("referralCodeInvalid"));
    try {
      await redeemReferral(code);
      setCode("");
      Alert.alert(t("referralRedeemed"));
    } catch (error) {
      Alert.alert(
        t("referralRedeemFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("referralProgramme")}</Title>
      <Card>
        <Text style={styles.label}>{t("yourReferralCode")}</Text>
        <Text selectable style={[styles.metric, { letterSpacing: 2 }]}>
          {data.code}
        </Text>
        <Text style={styles.muted}>
          {kind === "vendor"
            ? t("vendorReferralReward")
            : t("userReferralReward")}
        </Text>
        <Text style={styles.metric}>
          {progress.active}/{progress.target}
        </Text>
        <Button label={t("shareReferral")} onPress={() => void share()} />
      </Card>
      <Card>
        <Text style={styles.label}>{t("haveReferralCode")}</Text>
        <Field
          value={code}
          onChangeText={setCode}
          placeholder="AB12CD34EF"
          autoCapitalize="characters"
          maxLength={12}
        />
        <Button label={t("applyReferralCode")} onPress={() => void redeem()} />
      </Card>
      <Title>{t("referralHistory")}</Title>
      {data.referrals.length ? (
        data.referrals.map((item) => (
          <Card key={item.id}>
            <Text style={styles.label}>
              {t(`referralStatus_${item.status}`)}
            </Text>
            <Text style={styles.muted}>{item.created_at.slice(0, 10)}</Text>
            {item.reward ? (
              <Text style={styles.muted}>
                {t("referralReward")}: {item.reward}
              </Text>
            ) : null}
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.muted}>{t("referralEmpty")}</Text>
        </Card>
      )}
    </Screen>
  );
}
