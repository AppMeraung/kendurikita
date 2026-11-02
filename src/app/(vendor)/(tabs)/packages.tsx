import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { validVendorPackage } from "../../../domain/vendorOperations";
import { vendorCanAdd } from "../../../domain/entitlements";
import {
  deleteVendorPackage,
  loadVendorPackages,
  saveVendorPackage,
} from "../../../services/vendorOperations";
import { Button, Card, Empty, Field, Screen, styles, Title } from "../../../ui";
import { useVendorPlan } from "../../../state/usePlan";
type Package = {
  id: string;
  name: string;
  price: number;
  price_type: "from" | "fixed" | "per_pax";
  inclusions: string[];
  addons: string[];
  minimum_pax?: number;
  coverage: string[];
  travel_charge: number;
  active: boolean;
};
const priceTypes: Package["price_type"][] = ["from", "fixed", "per_pax"];
export default function Packages() {
  const { t } = useTranslation();
  const { plan } = useVendorPlan();
  const [items, setItems] = useState<Package[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string>();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<Package["price_type"]>("fixed");
  const [inclusions, setInclusions] = useState("");
  const [addons, setAddons] = useState("");
  const [minimumPax, setMinimumPax] = useState("");
  const [coverage, setCoverage] = useState("");
  const [travelCharge, setTravelCharge] = useState("0");
  const load = async () => {
    try {
      const result = await loadVendorPackages();
      setVendorId(result.vendorId);
      setItems(result.items as Package[]);
    } catch (error) {
      Alert.alert(
        t("vendorPackageLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const clear = () => {
    setOpen(false);
    setEditing(undefined);
    setName("");
    setPrice("");
    setPriceType("fixed");
    setInclusions("");
    setAddons("");
    setMinimumPax("");
    setCoverage("");
    setTravelCharge("0");
  };
  const edit = (item: Package) => {
    setEditing(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setPriceType(item.price_type);
    setInclusions((item.inclusions || []).join(", "));
    setAddons((item.addons || []).join(", "));
    setMinimumPax(item.minimum_pax ? String(item.minimum_pax) : "");
    setCoverage((item.coverage || []).join(", "));
    setTravelCharge(String(item.travel_charge || 0));
    setOpen(true);
  };
  const save = async () => {
    if (!editing && !vendorCanAdd(plan, "packages", items.length))
      return Alert.alert(t("vendorPackageLimitReached"));
    if (!validVendorPackage(name, price, minimumPax, travelCharge))
      return Alert.alert(t("vendorPackageInvalid"));
    try {
      await saveVendorPackage(vendorId, editing, {
        name: name.trim(),
        price: Number(price),
        price_type: priceType,
        inclusions: inclusions
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        addons: addons
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        minimum_pax: minimumPax ? Number(minimumPax) : null,
        coverage: coverage
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        travel_charge: Number(travelCharge),
        active: true,
      });
      clear();
      await load();
    } catch (error) {
      Alert.alert(
        t("vendorPackageSaveFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  return (
    <Screen>
      <Title>{t("vendorPackages")}</Title>
      {items.length ? (
        items.map((item) => (
          <Pressable key={item.id} accessibilityLabel={`${t("edit")} ${item.name}`} onPress={() => edit(item)}>
            <Card>
              <Text style={styles.label}>
                {item.name} · RM {Number(item.price).toFixed(2)}
              </Text>
              <Text style={styles.muted}>
                {t(`vendorPriceType_${item.price_type}`)}
                {item.minimum_pax ? ` · min ${item.minimum_pax} pax` : ""}
              </Text>
              <Text style={styles.muted}>
                {(item.inclusions || []).join(" · ")}
              </Text>
            </Card>
          </Pressable>
        ))
      ) : (
        <Empty
          icon="🏷️"
          text={t("vendorPackagesEmpty")}
          action={t("vendorPackageAdd")}
          onPress={() => setOpen(true)}
        />
      )}
      <Button label={t("vendorPackageAdd")} onPress={() => setOpen(true)} />
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>
            {editing ? t("vendorPackageEdit") : t("vendorPackageAdd")}
          </Title>
          <Field
            value={name}
            onChangeText={setName}
            placeholder={t("packageName")}
          />
          <Field
            value={price}
            onChangeText={setPrice}
            placeholder={t("price")}
            keyboardType="numeric"
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {priceTypes.map((value) => (
              <Button
                key={value}
                label={t(`vendorPriceType_${value}`)}
                onPress={() => setPriceType(value)}
                secondary={priceType !== value}
              />
            ))}
          </View>
          <Field
            value={inclusions}
            onChangeText={setInclusions}
            placeholder={t("packageInclusions")}
            multiline
          />
          <Field
            value={addons}
            onChangeText={setAddons}
            placeholder={t("packageAddons")}
            multiline
          />
          <Field
            value={minimumPax}
            onChangeText={setMinimumPax}
            placeholder={t("minimumPax")}
            keyboardType="numeric"
          />
          <Field
            value={coverage}
            onChangeText={setCoverage}
            placeholder={t("coverageAreas")}
          />
          <Field
            value={travelCharge}
            onChangeText={setTravelCharge}
            placeholder={t("travelCharge")}
            keyboardType="numeric"
          />
          <Button label={t("save")} onPress={() => void save()} />
          {editing ? (
            <Button
              label={t("delete")}
              onPress={() =>
                void deleteVendorPackage(editing)
                  .then(clear)
                  .then(load)
                  .catch((error) =>
                    Alert.alert(t("vendorPackageSaveFailed"), error.message),
                  )
              }
              secondary
            />
          ) : null}
          <Button label={t("cancel")} onPress={clear} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
