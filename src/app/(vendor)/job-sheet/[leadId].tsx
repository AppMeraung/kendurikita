import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { loadVendorJobSheet, VendorJobSheet } from "../../../services/jobSheet";
import { Button, Card, Screen, styles, Title } from "../../../ui";

const venueName = (venue: VendorJobSheet["event"]["venue"]) =>
  typeof venue === "string" ? venue : venue?.name || "";

export default function JobSheet() {
  const { t } = useTranslation();
  const { leadId = "" } = useLocalSearchParams<{ leadId: string }>();
  const [sheet, setSheet] = useState<VendorJobSheet | null>(null);
  useEffect(() => {
    void loadVendorJobSheet(leadId)
      .then(setSheet)
      .catch((error) =>
        Alert.alert(
          t("jobSheetUnavailable"),
          error instanceof Error ? error.message : t("unknownError"),
        ),
      );
  }, [leadId, t]);
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Text style={styles.label}>‹ {t("back")}</Text>
      </Pressable>
      <Title>{t("customerJobSheet")}</Title>
      {!sheet ? <Text style={styles.muted}>{t("loading")}</Text> : <>
        <Card>
          <Text style={styles.label}>{sheet.event.name}</Text>
          <Text style={styles.muted}>{sheet.event.type}</Text>
          <Text style={styles.muted}>{sheet.event.dates?.join(" · ")}</Text>
          <Text style={styles.muted}>{venueName(sheet.event.venue)}</Text>
          <Text style={styles.muted}>{t("estimatedGuests")}: {sheet.event.estimated_guests}</Text>
        </Card>
        <Title>{t("schedule")}</Title>
        {sheet.timeline.length ? sheet.timeline.map((item, index) => <Card key={`${item.title}-${index}`}>
          <Text style={styles.label}>{item.title}</Text>
          <Text style={styles.muted}>{[item.starts_at, item.ends_at].filter(Boolean).map((value) => new Date(value!).toLocaleString()).join(" – ")}</Text>
          {item.pic_name ? <Text style={styles.muted}>{t("pic")}: {item.pic_name}</Text> : null}
          {item.note ? <Text style={styles.muted}>{item.note}</Text> : null}
        </Card>) : <Text style={styles.muted}>{t("emptySchedule")}</Text>}
        <Title>{t("picContacts")}</Title>
        {sheet.contacts.length ? sheet.contacts.map((contact) => <Card key={`${contact.name}-${contact.phone}`}>
          <Text style={styles.label}>{contact.name} · {contact.role}</Text>
          <Button label={t("call")} onPress={() => void Linking.openURL(`tel:${contact.phone.replace(/[^+\d]/g, "")}`)} secondary />
          <Button label="WhatsApp" onPress={() => void Linking.openURL(`https://wa.me/${contact.phone.replace(/\D/g, "")}`)} secondary />
        </Card>) : <Text style={styles.muted}>{t("emptyPicContacts")}</Text>}
      </>}
    </Screen>
  );
}
