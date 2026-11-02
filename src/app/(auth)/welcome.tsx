import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, ScrollViewInstance, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../state/AppState";
import { Button, palette, Screen, styles, Title } from "../../ui";

const slides = [
  { icon: "calendar-outline", title: "tourPlanTitle", body: "tourPlanBody" },
  { icon: "wallet-outline", title: "tourBudgetTitle", body: "tourBudgetBody" },
  { icon: "people-outline", title: "tourGuestsTitle", body: "tourGuestsBody" },
  { icon: "storefront-outline", title: "tourVendorsTitle", body: "tourVendorsBody" },
] as const;

export default function Welcome() {
  const { t } = useTranslation();
  const { setToured } = useAppState();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const signIn = () => { setToured(); router.replace("/(auth)/sign-in"); };
  const guest = () => { setToured(); router.replace("/(auth)/setup"); };
  const move = (next: number) => { setIndex(next); scroller.current?.scrollTo({ x: next * width, animated: true }); };
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  return <Screen scroll={false}>
    <View style={{ flex: 1, paddingTop: 18 }}>
      <View style={styles.between}><Text style={{ color: palette.gold, fontWeight: "900", letterSpacing: 2 }}>{t("brand")}</Text>{index < slides.length - 1 ? <Pressable accessibilityLabel={t("skip")} onPress={() => move(slides.length - 1)}><Text style={styles.label}>{t("skip")}</Text></Pressable> : <View />}</View>
      <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} style={{ flex: 1 }}>
        {slides.map((slide) => <View key={slide.title} style={{ width: Math.max(0, width - 40), alignItems: "center", justifyContent: "center", gap: 24, paddingHorizontal: 16 }}>
          <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" }}><Ionicons name={slide.icon} size={72} color={palette.maroon} /></View>
          <Title>{t(slide.title)}</Title><Text style={{ color: palette.muted, fontSize: 17, lineHeight: 25, textAlign: "center" }}>{t(slide.body)}</Text>
        </View>)}
      </ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>{slides.map((slide, position) => <View key={slide.title} style={{ width: position === index ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: position === index ? palette.maroon : palette.line }} />)}</View>
      <View style={{ gap: 10, paddingVertical: 18 }}>{index < slides.length - 1 ? <Button label={t("continue")} onPress={() => move(index + 1)} /> : <><Button label={t("start")} onPress={signIn} /><Button label={t("guestMode")} onPress={guest} secondary /></>}</View>
    </View>
  </Screen>;
}
