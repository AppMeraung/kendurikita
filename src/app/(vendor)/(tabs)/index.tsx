import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { validEventDocument } from "../../../domain/documents";
import {
  validFoundedYear,
  vendorProfileCompleteness,
  VendorProfileDraft,
} from "../../../domain/vendorProfile";
import { vendorLimits } from "../../../domain/entitlements";
import {
  loadVendorProfile,
  saveVendorProfile,
  uploadVerificationDocument,
  vendorCategories,
} from "../../../services/vendorProfile";
import { Button, Card, Field, Screen, styles, Title } from "../../../ui";
import { useVendorPlan } from "../../../state/usePlan";
import { VendorFirstStepsCoach } from "../../../components/Guidance";
import { PlaceSearch } from "../../../components/PlaceSearch";
import { PlaceLocation } from "../../../services/places";

const initial: VendorProfileDraft = {
  company: "",
  ssm: "",
  businessType: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  state: "",
  coverage: "",
  foundedYear: "",
  languages: "",
  description: "",
  deposit: "",
  cancellation: "",
  rescheduling: "",
};
type FileAsset = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};
export default function VendorHome() {
  const { t } = useTranslation();
  const { plan } = useVendorPlan();
  const [profile, setProfile] = useState(initial);
  const [categories, setCategories] = useState<string[]>([]);
  const [ssmFile, setSsmFile] = useState<FileAsset>();
  const [icFile, setIcFile] = useState<FileAsset>();
  const [existingDocs, setExistingDocs] = useState({ ssm: false, ic: false });
  const [status, setStatus] = useState("pending");
  const [location, setLocation] = useState<PlaceLocation>();
  const change = (key: keyof VendorProfileDraft, value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));
  const load = async () => {
    try {
      const row = await loadVendorProfile();
      if (!row) return;
      setProfile({
        company: row.company_name || "",
        ssm: row.ssm_number || "",
        businessType: row.business_type || "",
        ownerName: row.owner_name || "",
        phone: row.phone || "",
        email: row.email || "",
        address: row.address?.line || "",
        state: row.address?.state || "",
        coverage: (row.coverage || []).join(", "),
        foundedYear: row.founded_year ? String(row.founded_year) : "",
        languages: (row.languages || []).join(", "),
        description: row.description?.ms || row.description?.en || "",
        deposit: String(row.policies?.deposit_percentage || ""),
        cancellation: row.policies?.cancellation || "",
        rescheduling: row.policies?.rescheduling || "",
      });
      setCategories(
        (row.vendor_categories || []).map(
          (item: { category: string }) => item.category,
        ),
      );
      setExistingDocs({
        ssm: !!row.verification_documents?.ssm,
        ic: !!row.verification_documents?.ic,
      });
      setStatus(row.verification_status || "pending");
      if (row.address?.place_id && Number.isFinite(row.address?.latitude) && Number.isFinite(row.address?.longitude)) setLocation({ placeId: row.address.place_id, name: row.address.line || "", latitude: row.address.latitude, longitude: row.address.longitude });
    } catch (error) {
      Alert.alert(
        t("vendorLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pick = async (kind: "ssm" | "ic") => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if (!validEventDocument(file.mimeType || undefined, file.size))
      return Alert.alert(t("documentInvalid"));
    const value = {
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType || undefined,
      size: file.size,
    };
    if (kind === "ssm") setSsmFile(value);
    else setIcFile(value);
  };
  const save = async () => {
    if (
      !profile.company.trim() ||
      !profile.ssm.trim() ||
      !profile.ownerName.trim() ||
      !profile.phone.trim() ||
      !profile.email.trim() ||
      !categories.length
    )
      return Alert.alert(t("vendorRequired"));
    if (!validFoundedYear(profile.foundedYear))
      return Alert.alert(t("vendorYearInvalid"));
    const coverageCount = profile.coverage
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean).length;
    if (categories.length > vendorLimits[plan].categories)
      return Alert.alert(t("vendorCategoryLimitReached"));
    if (coverageCount > vendorLimits[plan].states)
      return Alert.alert(t("vendorCoverageLimitReached"));
    try {
      const id = await saveVendorProfile(profile, categories, location);
      if (ssmFile) await uploadVerificationDocument(id, "ssm", ssmFile);
      if (icFile) await uploadVerificationDocument(id, "ic", icFile);
      setExistingDocs({
        ssm: existingDocs.ssm || !!ssmFile,
        ic: existingDocs.ic || !!icFile,
      });
      setStatus("pending");
      Alert.alert(t("vendorSaved"));
    } catch (error) {
      Alert.alert(
        t("vendorSaveFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const progress = vendorProfileCompleteness(
    profile,
    categories.length,
    existingDocs.ssm || !!ssmFile,
    existingDocs.ic || !!icFile,
  );
  return (
    <Screen>
      <VendorFirstStepsCoach />
      <Title>{t("vendorProfile")}</Title>
      <Card>
        <Text style={styles.label}>
          {t("profileComplete", { percent: progress })}
        </Text>
        <Text style={styles.muted}>{t(`verificationStatus_${status}`)}</Text>
      </Card>
      <Field
        value={profile.company}
        onChangeText={(v) => change("company", v)}
        placeholder={t("companyName")}
      />
      <Field
        value={profile.ssm}
        onChangeText={(v) => change("ssm", v)}
        placeholder={t("ssmNumber")}
      />
      <Field
        value={profile.businessType}
        onChangeText={(v) => change("businessType", v)}
        placeholder={t("businessType")}
      />
      <Field
        value={profile.ownerName}
        onChangeText={(v) => change("ownerName", v)}
        placeholder={t("ownerName")}
      />
      <Field
        value={profile.phone}
        onChangeText={(v) => change("phone", v)}
        placeholder={t("phone")}
      />
      <Field
        value={profile.email}
        onChangeText={(v) => change("email", v)}
        placeholder={t("email")}
        keyboardType="email-address"
      />
      <PlaceSearch
        value={profile.address}
        onChangeText={(v) => { change("address", v); setLocation(undefined); }}
        onSelect={setLocation}
        country="MY"
        placeholder={t("businessAddress")}
      />
      <Field
        value={profile.state}
        onChangeText={(v) => change("state", v)}
        placeholder={t("state")}
      />
      <Field
        value={profile.coverage}
        onChangeText={(v) => change("coverage", v)}
        placeholder={t("coverageAreas")}
      />
      <Field
        value={profile.foundedYear}
        onChangeText={(v) => change("foundedYear", v)}
        placeholder={t("foundedYear")}
        keyboardType="numeric"
      />
      <Field
        value={profile.languages}
        onChangeText={(v) => change("languages", v)}
        placeholder={t("languagesServed")}
      />
      <Field
        value={profile.description}
        onChangeText={(v) => change("description", v)}
        placeholder={t("vendorDescription")}
        multiline
      />
      <Text style={styles.label}>{t("vendorCategories")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {vendorCategories.map((category) => (
          <Button
            key={category}
            label={t(`vendorCategory_${category}`)}
            onPress={() =>
              setCategories((current) =>
                current.includes(category)
                  ? current.filter((item) => item !== category)
                  : [...current, category],
              )
            }
            secondary={!categories.includes(category)}
          />
        ))}
      </View>
      <Field
        value={profile.deposit}
        onChangeText={(v) => change("deposit", v)}
        placeholder={t("depositPercent")}
        keyboardType="numeric"
      />
      <Field
        value={profile.cancellation}
        onChangeText={(v) => change("cancellation", v)}
        placeholder={t("cancellationPolicy")}
        multiline
      />
      <Field
        value={profile.rescheduling}
        onChangeText={(v) => change("rescheduling", v)}
        placeholder={t("reschedulingPolicy")}
        multiline
      />
      <Button
        label={ssmFile || existingDocs.ssm ? t("ssmAttached") : t("uploadSsm")}
        onPress={() => void pick("ssm")}
        secondary
      />
      <Button
        label={icFile || existingDocs.ic ? t("icAttached") : t("uploadIc")}
        onPress={() => void pick("ic")}
        secondary
      />
      <Button label={t("saveProfile")} onPress={() => void save()} />
      <Button
        label={t("managePortfolio")}
        onPress={() => router.push("/(vendor)/portfolio")}
        secondary
      />
      <Button
        label={t("vendorBundles")}
        onPress={() => router.push("/(vendor)/bundles")}
        secondary
      />
      <Button label={t("vendorPlans")} onPress={() => router.push("/(vendor)/vendor-plans")} secondary />
      <Button
        label={t("referralProgramme")}
        onPress={() => router.push("/referrals")}
        secondary
      />
    </Screen>
  );
}
