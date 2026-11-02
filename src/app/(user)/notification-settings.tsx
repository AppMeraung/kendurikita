import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { NotificationPreferences, loadNotificationPreferences, notificationCategories, saveNotificationPreferences } from "../../services/notifications";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [value, setValue] = useState<NotificationPreferences>();
  useEffect(() => { void Promise.resolve().then(loadNotificationPreferences).then(setValue).catch(() => undefined); }, []);
  if (!value) return <Screen><Title>{t("notificationSettings")}</Title><Text style={styles.muted}>{t("loading")}</Text></Screen>;
  const save = async () => { try { await saveNotificationPreferences(value); Alert.alert(t("saved")); } catch (error) { Alert.alert(t("saveFailed"), error instanceof Error ? error.message : t("unknownError")); } };
  return <Screen>
    <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}><Text style={styles.label}>‹ {t("back")}</Text></Pressable>
    <Title>{t("notificationSettings")}</Title>
    <Card><Text style={styles.label}>{t("notificationCategories")}</Text>{notificationCategories.filter((category) => category !== "promotions").map((category) => <Button key={category} label={`${t(`notificationCategory_${category}`)} · ${value.categories[category] ? t("active") : t("inactive")}`} onPress={() => setValue((current) => current ? { ...current, categories: { ...current.categories, [category]: !current.categories[category] } } : current)} secondary={!value.categories[category]} />)}</Card>
    <Card><Text style={styles.label}>{t("quietHours")}</Text><Field value={value.quietStart} onChangeText={(quietStart) => setValue({ ...value, quietStart })} placeholder="22:00" /><Field value={value.quietEnd} onChangeText={(quietEnd) => setValue({ ...value, quietEnd })} placeholder="08:00" /><Text style={styles.muted}>{value.timezone}</Text></Card>
    <Card><Text style={styles.label}>{t("marketingOptIn")}</Text><Text style={styles.muted}>{t("marketingOptInDetail")}</Text><Button label={value.promotions ? t("active") : t("inactive")} onPress={() => setValue({ ...value, promotions: !value.promotions, categories: { ...value.categories, promotions: !value.promotions } })} secondary={!value.promotions} /></Card>
    <Button label={t("save")} onPress={() => void save()} />
  </Screen>;
}
