import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { discoverVendors } from "../../../domain/vendorDiscovery";
import { cloudConfigured } from "../../../services/supabase";
import { loadDiscoverableVendors } from "../../../services/vendorDiscovery";
import { useAppState } from "../../../state/AppState";
import { Button, Card, Empty, palette, Screen, SearchField, styles, Title } from "../../../ui";

// Same keys and labels as the category rows on the Vendors tab.
const labels: Record<string, string> = {
  venue: "venue",
  catering: "categoryCatering",
  photo_video: "categoryPhotoVideo",
  attire: "categoryAttire",
  decor: "vendorCatDecor",
  entertainment: "vendorCatEntertainment",
};

export default function VendorCategory() {
  const { t } = useTranslation();
  const { key = "" } = useLocalSearchParams<{ key: string }>();
  const { event } = useAppState();
  const [query, setQuery] = useState("");
  const vendors = useQuery({ queryKey: ["vendors", "discoverable"], enabled: cloudConfigured, queryFn: loadDiscoverableVendors, staleTime: 300000 });
  const shown = discoverVendors(vendors.data || [], { query, category: key, origin: event?.venueLocation });
  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="arrow-back" size={26} color={palette.maroon} />
      </Pressable>
      <Title subtitle={t("vendorsIntro")}>{t(labels[key] || "vendors")}</Title>
      <SearchField value={query} onChangeText={setQuery} placeholder={t("vendorSearchPlaceholder")} accessibilityLabel={t("vendorSearchPlaceholder")} />
      {vendors.isLoading ? <Text style={styles.muted}>{t("loading")}</Text> : null}
      {!vendors.isLoading && !shown.length ? (
        <Empty icon="🏪" text={cloudConfigured ? t("emptyVendors") : t("cloudRequired")} action={t("refresh")} onPress={() => void vendors.refetch()} />
      ) : null}
      {shown.map((vendor) => (
        <Pressable key={vendor.id} accessibilityRole="button" accessibilityLabel={vendor.companyName} onPress={() => router.push(`/vendor/${vendor.slug}`)}>
          <Card>
            <View style={styles.row}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="storefront-outline" size={22} color={palette.maroon} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.label}>{vendor.companyName}{vendor.sponsored ? ` · ${t("sponsored")}` : ""}</Text>
                <Text style={[styles.muted, { fontSize: 13 }]}>{vendor.rating.toFixed(1)}★ ({vendor.reviewCount}) · {vendor.coverage.join(", ")}</Text>
                <Text style={[styles.label, { color: palette.maroon, fontSize: 13 }]}>{vendor.minimumPrice == null ? t("priceOnRequest") : `${t("fromPrice")} RM ${vendor.minimumPrice.toFixed(0)}`}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.muted} />
            </View>
          </Card>
        </Pressable>
      ))}
      <Button icon="storefront-outline" label={t("vendorTitle")} onPress={() => router.push("/(user)/(tabs)/vendors")} secondary />
    </Screen>
  );
}
