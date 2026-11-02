import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { validBundle } from "../../domain/vendorBundles";
import {
  createBundle,
  deleteBundle,
  loadBundleEditor,
} from "../../services/vendorBundles";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

type Vendor = {
  id: string;
  company_name: string;
  vendor_packages: { id: string; name: string }[];
};
type Bundle = {
  id: string;
  name: string;
  description?: string;
  price: number;
  vendor_bundle_members: { vendors?: { company_name: string } }[];
};
const commissionEnabled =
  process.env.EXPO_PUBLIC_VENDOR_COMMISSION_ENABLED === "true";

export default function VendorBundles() {
  const { t } = useTranslation();
  const [ownerId, setOwnerId] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const load = async () => {
    try {
      const data = await loadBundleEditor();
      setOwnerId(data.owner.id);
      setSelected([data.owner.id]);
      setVendors(data.vendors as Vendor[]);
      setBundles(data.bundles as unknown as Bundle[]);
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
  const save = async () => {
    const members = selected.map((vendorId) => ({
      vendorId,
      packageId: vendors.find((vendor) => vendor.id === vendorId)
        ?.vendor_packages?.[0]?.id,
      commission: 0,
    }));
    if (!validBundle(name, price, members))
      return Alert.alert(t("bundleInvalid"));
    try {
      await createBundle(
        ownerId,
        {
          name,
          description,
          price: Number(price),
          commissionEnabled,
        },
        members,
      );
      setName("");
      setDescription("");
      setPrice("");
      await load();
    } catch (error) {
      Alert.alert(
        t("bundleSaveFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("vendorBundles")}</Title>
      <Field
        value={name}
        onChangeText={setName}
        placeholder={t("bundleName")}
      />
      <Field
        value={description}
        onChangeText={setDescription}
        placeholder={t("bundleDescription")}
        multiline
      />
      <Field
        value={price}
        onChangeText={setPrice}
        placeholder={t("bundlePrice")}
        keyboardType="numeric"
      />
      <Text style={styles.label}>{t("bundlePartners")}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {vendors.map((vendor) => {
          const active = selected.includes(vendor.id);
          return (
            <Button
              key={vendor.id}
              label={vendor.company_name}
              secondary={!active}
              disabled={vendor.id === ownerId}
              onPress={() =>
                setSelected((current) =>
                  active
                    ? current.filter((id) => id !== vendor.id)
                    : [...current, vendor.id],
                )
              }
            />
          );
        })}
      </View>
      <Text style={styles.muted}>
        {commissionEnabled
          ? t("bundleCommissionEnabled")
          : t("bundleCommissionDisabled")}
      </Text>
      <Button label={t("createBundle")} onPress={() => void save()} />
      {bundles.map((bundle) => (
        <Card key={bundle.id}>
          <Text style={styles.label}>
            {bundle.name} · RM {Number(bundle.price).toFixed(2)}
          </Text>
          <Text style={styles.muted}>{bundle.description}</Text>
          <Text style={styles.muted}>
            {(bundle.vendor_bundle_members || [])
              .map((member) => member.vendors?.company_name)
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Button
            label={t("delete")}
            onPress={() =>
              void deleteBundle(bundle.id)
                .then(load)
                .catch((error) =>
                  Alert.alert(t("bundleSaveFailed"), error.message),
                )
            }
            secondary
          />
        </Card>
      ))}
    </Screen>
  );
}
