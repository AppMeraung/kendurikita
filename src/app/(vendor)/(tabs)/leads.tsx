import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Alert, Modal, Text } from "react-native";
import { useTranslation } from "react-i18next";
import {
  QuotationLine,
  quotationTotal,
  validQuotationLine,
} from "../../../domain/quotation";
import { vendorFeature } from "../../../domain/entitlements";
import { createQuotation } from "../../../services/quotation";
import { cloudConfigured, supabase } from "../../../services/supabase";
import { Button, Card, Empty, Field, Screen, styles, Title } from "../../../ui";
import { useVendorPlan } from "../../../state/usePlan";

type Lead = {
  id: string;
  message: string;
  status: string;
  created_at: string;
  event_snapshot: Record<string, unknown>;
};
export default function Leads() {
  const { t } = useTranslation();
  const { plan } = useVendorPlan();
  const [items, setItems] = useState<Lead[]>([]);
  const [vendor, setVendor] = useState<{
    id: string;
    company_name: string;
  } | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [lines, setLines] = useState<QuotationLine[]>([]);
  const load = async () => {
    if (!cloudConfigured) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const owner = await supabase
      .from("vendors")
      .select("id,company_name")
      .eq("owner_id", user.id)
      .single();
    if (owner.error) return;
    setVendor(owner.data);
    const result = await supabase
      .from("leads")
      .select("id,message,status,created_at,event_snapshot")
      .eq("vendor_id", owner.data.id)
      .order("created_at", { ascending: false });
    if (!result.error) setItems(result.data || []);
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  const quote = async () => {
    if (!vendorFeature(plan, "quotations"))
      return Alert.alert(t("vendorProRequired"));
    if (!selected || !vendor) return;
    if (!lines.length) return Alert.alert(t("quotationNeedsItem"));
    try {
      await createQuotation(selected.id, vendor.id, vendor.company_name, lines);
      setSelected(null);
      setLines([]);
      await load();
    } catch (error) {
      Alert.alert(
        t("quotationFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const addLine = () => {
    const line = {
      description: description.trim(),
      quantity: Number(quantity),
      unitPrice: Number(price),
    };
    if (!validQuotationLine(line)) return Alert.alert(t("quotationInvalid"));
    setLines((current) => [...current, line]);
    setDescription("");
    setQuantity("1");
    setPrice("");
  };
  return (
    <Screen>
      <Title>{t("vendorLeads")}</Title>
      {items.length ? (
        items.map((lead) => (
          <Card key={lead.id}>
            <Text style={styles.label}>{t(`leadStatus_${lead.status}`)}</Text>
            <Text style={styles.muted}>
              {String(lead.event_snapshot.name || "")} ·{" "}
              {String(lead.event_snapshot.date || "")} ·{" "}
              {String(lead.event_snapshot.venue || "")}
            </Text>
            <Text style={styles.muted}>{lead.message}</Text>
            {vendorFeature(plan, "quotations") ? (
              <Button
                label={t("createQuotation")}
                onPress={() => setSelected(lead)}
                secondary
              />
            ) : null}
            <Button
              label={t("openChat")}
              onPress={() => router.push(`/chat/${lead.id}`)}
              secondary
            />
            {lead.status === "confirmed" ? (
              <Button
                label={t("customerJobSheet")}
                onPress={() => router.push(`/(vendor)/job-sheet/${lead.id}`)}
                secondary
              />
            ) : null}
          </Card>
        ))
      ) : (
        <Empty
          icon="📨"
          text={t("emptyLeads")}
          action={t("refresh")}
          onPress={() => void load()}
        />
      )}
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Screen>
          <Title>{t("createQuotation")}</Title>
          <Field
            value={description}
            onChangeText={setDescription}
            placeholder={t("quotationDescription")}
          />
          <Field
            value={quantity}
            onChangeText={setQuantity}
            placeholder={t("quantity")}
            keyboardType="numeric"
          />
          <Field
            value={price}
            onChangeText={setPrice}
            placeholder={t("unitPrice")}
            keyboardType="numeric"
          />
          <Button label={t("addQuotationItem")} onPress={addLine} secondary />
          {lines.map((line, index) => (
            <Card key={`${line.description}-${index}`}>
              <Text style={styles.label}>
                {line.description} · {line.quantity} × RM{" "}
                {line.unitPrice.toFixed(2)}
              </Text>
              <Button
                label={t("delete")}
                onPress={() =>
                  setLines((current) =>
                    current.filter((_, lineIndex) => lineIndex !== index),
                  )
                }
                secondary
              />
            </Card>
          ))}
          <Text style={styles.label}>
            {t("total")}: RM {quotationTotal(lines).toFixed(2)}
          </Text>
          <Button label={t("sendQuotation")} onPress={() => void quote()} />
          <Button
            label={t("cancel")}
            onPress={() => {
              setSelected(null);
              setLines([]);
            }}
            secondary
          />
        </Screen>
      </Modal>
    </Screen>
  );
}
