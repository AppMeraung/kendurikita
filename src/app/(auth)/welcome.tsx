import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, ImageBackground, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, ScrollViewInstance, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../state/AppState";
import { Button, palette, styles, Title } from "../../ui";

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
  return <ImageBackground source={require("../../../assets/welcome-wedding-v2.png")} style={{ flex: 1 }} resizeMode="cover">
    <LinearGradient colors={["rgba(39,10,20,0.2)", "rgba(39,10,20,0.08)", "rgba(39,10,20,0.82)"]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 24 }}>
        <View style={styles.between}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={require("../../../assets/icon.png")} style={{ width: 42, height: 42, borderRadius: 12 }} />
            <Text style={{ color: palette.white, fontSize: 18, fontWeight: "900", letterSpacing: 1.2 }}>{t("brand")}</Text>
          </View>
          {index < slides.length - 1 ? <Pressable accessibilityLabel={t("skip")} onPress={() => move(slides.length - 1)} style={{ padding: 10, backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 999 }}><Text style={styles.label}>{t("skip")}</Text></Pressable> : <View />}
        </View>
        <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} style={{ flex: 1 }}>
          {slides.map((slide, position) => <View key={slide.title} style={{ width: Math.max(0, width - 40), justifyContent: "flex-end", paddingBottom: 22 }}>
            <View style={{ width: "100%", gap: 12, padding: 20, borderRadius: 24, backgroundColor: "rgba(255,248,236,0.94)", borderWidth: 1, borderColor: "rgba(255,255,255,0.65)" }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: position === 0 ? palette.maroon : palette.rose, alignItems: "center", justifyContent: "center" }}><Ionicons name={slide.icon} size={28} color={position === 0 ? palette.white : palette.maroon} /></View>
              <Title>{t(slide.title)}</Title>
              <Text style={{ color: palette.muted, fontSize: 16, lineHeight: 24 }}>{t(slide.body)}</Text>
              <Text style={{ color: palette.gold, fontWeight: "800" }}>{position + 1} / {slides.length}</Text>
            </View>
          </View>)}
        </ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 }}>{slides.map((slide, position) => <View key={slide.title} style={{ width: position === index ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: position === index ? palette.gold : "rgba(255,255,255,0.55)" }} />)}</View>
        <View style={{ gap: 10 }}>{index < slides.length - 1 ? <Button label={t("continue")} onPress={() => move(index + 1)} /> : <><Button label={t("start")} onPress={signIn} /><Button label={t("guestMode")} onPress={guest} secondary /></>}</View>
      </View>
    </LinearGradient>
  </ImageBackground>;
}
