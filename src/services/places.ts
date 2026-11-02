import { Language } from "../i18n";
import { supabase } from "./supabase";

export type PlaceLocation = {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type PlaceSuggestion = { place: string; text: string };

export async function searchPlaces(query: string, language: Language, country: "MY" | "ID") {
  const { data, error } = await supabase.functions.invoke("google-places", {
    body: { action: "search", query, language, country },
  });
  if (error) throw error;
  return (data?.suggestions || []) as PlaceSuggestion[];
}

export async function loadPlace(place: string, language: Language) {
  const { data, error } = await supabase.functions.invoke("google-places", {
    body: { action: "details", place, language },
  });
  if (error) throw error;
  return data as PlaceLocation;
}
