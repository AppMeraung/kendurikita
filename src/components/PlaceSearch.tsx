import { useState } from "react";
import { Alert, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { Language } from "../i18n";
import { loadPlace, PlaceLocation, PlaceSuggestion, searchPlaces } from "../services/places";
import { Button, Card, Field, styles } from "../ui";

export function PlaceSearch({ value, onChangeText, onSelect, country, placeholder }: {
  value: string;
  onChangeText: (value: string) => void;
  onSelect: (place: PlaceLocation) => void;
  country: "MY" | "ID";
  placeholder?: string;
}) {
  const { t, i18n } = useTranslation();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const language = i18n.language.split("-")[0] as Language;
  const search = async () => {
    if (value.trim().length < 3) return Alert.alert(t("placeSearchNeedsText"));
    setBusy(true);
    try { setSuggestions(await searchPlaces(value.trim(), language, country)); }
    catch (error) { Alert.alert(t("placeSearchUnavailable"), error instanceof Error ? error.message : t("unknownError")); }
    finally { setBusy(false); }
  };
  const select = async (item: PlaceSuggestion) => {
    setBusy(true);
    try { const place = await loadPlace(item.place, language); onChangeText(place.name); onSelect(place); setSuggestions([]); }
    catch (error) { Alert.alert(t("placeSearchUnavailable"), error instanceof Error ? error.message : t("unknownError")); }
    finally { setBusy(false); }
  };
  return <>
    <Field value={value} onChangeText={(text) => { onChangeText(text); setSuggestions([]); }} placeholder={placeholder || t("venueHint")} />
    <Button label={busy ? t("loading") : t("searchGooglePlaces")} onPress={() => void search()} secondary disabled={busy} />
    {suggestions.length ? <Card>
      {suggestions.map((item) => <Button key={item.place} label={item.text} onPress={() => void select(item)} secondary disabled={busy} />)}
      <Text style={styles.muted}>Powered by Google</Text>
    </Card> : null}
  </>;
}
