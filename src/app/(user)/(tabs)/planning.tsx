import { router } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Screen, styles, Tile, Title } from "../../../ui";

export default function Planning() {
  const { t } = useTranslation();
  const tiles = [
    ["business-outline", t("venue"), "/(user)/(tabs)/vendors"],
    ["storefront-outline", t("vendors"), "/(user)/(tabs)/vendors"],
    ["gift-outline", t("packages"), "/(user)/vendor-bundles"],
    ["mail-outline", t("invitation"), "/(user)/invitation"],
    ["grid-outline", t("seatingPlan"), "/(user)/seating"],
    ["calendar-outline", t("schedule"), "/(user)/schedule"],
    ["checkbox-outline", t("checklist"), "/(user)/checklist"],
    ["wallet-outline", t("budget"), "/(user)/(tabs)/budget"],
    ["people-outline", t("guests"), "/(user)/(tabs)/guests"],
    ["document-text-outline", t("notes"), "/(user)/notes"],
  ] as const;
  return (
    <Screen>
      <Title subtitle={t("planningIntro")}>{t("planning")}</Title>
      <View style={styles.grid}>
        {tiles.map(([icon, label, href]) => <Tile key={label} icon={icon} label={label} onPress={() => router.push(href)} />)}
      </View>
    </Screen>
  );
}
