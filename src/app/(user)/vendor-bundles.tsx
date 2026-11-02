import { useEffect, useState } from "react";
import { Alert, Modal, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { loadPublicBundles, requestBundle } from "../../services/vendorBundles";
import { syncEvent } from "../../services/sync";
import { useAppState } from "../../state/AppState";
import { Button, Card, Empty, Field, Screen, styles, Title } from "../../ui";

type Bundle = {
  id: string;
  name: string;
  description?: string;
  price: number;
  vendor_bundle_members: {
    vendors?: { company_name: string };
    vendor_packages?: { name: string };
  }[];
};

export default function PublicBundles() {
  const { t } = useTranslation();
  const { event, updateEvent } = useAppState();
  const [items, setItems] = useState<Bundle[]>([]);
  const [selected, setSelected] = useState<Bundle>();
  const [message, setMessage] = useState("");
  const load = async () => {
    try {
      setItems((await loadPublicBundles()) as unknown as Bundle[]);
    } catch (error) {
      Alert.alert(
        t("bundleLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!event) return null;
  const request = async () => {
    if (!selected || !message.trim()) return Alert.alert(t("required"));
    try {
      const eventId = event.cloudId || (await syncEvent(event));
      updateEvent({ cloudId: eventId });
      await requestBundle(selected.id, eventId, message);
      setSelected(undefined);
      setMessage("");
      Alert.alert(t("bundleRequestSent"));
    } catch (error) {
      Alert.alert(
        t("bundleRequestFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("vendorBundles")}</Title>
      {items.length ? (
        items.map((bundle) => (
          <Card key={bundle.id}>
            <Text style={styles.label}>
              {bundle.name} · RM {Number(bundle.price).toFixed(2)}
            </Text>
            <Text style={styles.muted}>{bundle.description}</Text>
            {(bundle.vendor_bundle_members || []).map((member, index) => (
              <Text key={index} style={styles.muted}>
                {member.vendors?.company_name}
                {member.vendor_packages?.name
                  ? ` · ${member.vendor_packages.name}`
                  : ""}
              </Text>
            ))}
            <Button
              label={t("requestBundle")}
              onPress={() => setSelected(bundle)}
            />
          </Card>
        ))
      ) : (
        <Empty
          icon="🎁"
          text={t("bundlesEmpty")}
          action={t("refresh")}
          onPress={() => void load()}
        />
      )}
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(undefined)}
      >
        <Screen>
          <Title>{selected?.name}</Title>
          <Field
            value={message}
            onChangeText={setMessage}
            placeholder={t("bookingMessage")}
            multiline
          />
          <Button label={t("sendRequest")} onPress={() => void request()} />
          <Button
            label={t("cancel")}
            onPress={() => setSelected(undefined)}
            secondary
          />
        </Screen>
      </Modal>
    </Screen>
  );
}
