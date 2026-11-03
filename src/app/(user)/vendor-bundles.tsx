import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Alert, Modal, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { loadPublicBundles, requestBundle } from "../../services/vendorBundles";
import { syncEvent } from "../../services/sync";
import { useAppState } from "../../state/AppState";
import { Button, Empty, Field, palette, Screen, styles, Title } from "../../ui";

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
      <Title subtitle={t("bundlesIntro")}>{t("vendorBundles")}</Title>
      {items.length ? (
        <View style={[styles.grid, { gap: 10 }]}>
          {items.map((bundle) => (
            <View key={bundle.id} style={[styles.card, { flexBasis: "31%", flexGrow: 1, minWidth: 150, padding: 12, gap: 8 }]}>
              <Text style={[styles.label, { textAlign: "center" }]} numberOfLines={2}>{bundle.name}</Text>
              <Text style={{ textAlign: "center", fontSize: 18, fontWeight: "800", color: palette.maroon }}>RM {Number(bundle.price).toLocaleString("en-MY", { maximumFractionDigits: 0 })}</Text>
              {bundle.description ? <Text style={[styles.muted, { fontSize: 12, textAlign: "center" }]} numberOfLines={3}>{bundle.description}</Text> : null}
              <View style={{ gap: 4, flex: 1 }}>
                {(bundle.vendor_bundle_members || []).map((member, index) => (
                  <View key={index} style={{ flexDirection: "row", gap: 6, alignItems: "flex-start" }}>
                    <Ionicons name="checkmark" size={14} color={palette.gold} style={{ marginTop: 2 }} />
                    <Text style={[styles.muted, { fontSize: 12, flex: 1, lineHeight: 17 }]}>
                      {member.vendor_packages?.name || member.vendors?.company_name}
                    </Text>
                  </View>
                ))}
              </View>
              <Button label={t("requestBundle")} onPress={() => setSelected(bundle)} />
            </View>
          ))}
        </View>
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
