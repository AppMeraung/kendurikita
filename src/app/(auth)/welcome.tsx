import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Image, ImageBackground, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollViewInstance, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppState } from "../../state/AppState";
import { Button, palette, serif, styles } from "../../ui";

const slides = [
  { title: "tourPlanTitle", body: "tourPlanBody" },
  { title: "tourBudgetTitle", body: "tourBudgetBody" },
  { title: "tourGuestsTitle", body: "tourGuestsBody" },
  { title: "tourVendorsTitle", body: "tourVendorsBody" },
] as const;

export default function Welcome() {
  const { t } = useTranslation();
  const { setToured } = useAppState();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollViewInstance>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [index, setIndex] = useState(0);
  const signIn = () => { setToured(); router.replace("/(auth)/sign-in"); };
  const guest = () => { setToured(); router.replace("/(auth)/setup"); };
  const move = (next: number) => { setIndex(next); scroller.current?.scrollTo({ x: next * width, animated: true }); };
  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  return <ImageBackground source={require("../../../assets/welcome-wedding-v2.png")} style={{ flex: 1 }} resizeMode="cover">
    <LinearGradient colors={["rgba(39,10,20,0.25)", "rgba(39,10,20,0.1)", "rgba(39,10,20,0.8)"]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: 54, paddingBottom: 24 }}>
        <View style={[styles.between, { paddingHorizontal: 20 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={require("../../../assets/icon.png")} style={{ width: 42, height: 42, borderRadius: 12 }} />
            <Text style={{ color: palette.white, fontSize: 18, fontWeight: "900", letterSpacing: 1.2 }}>{t("brand")}</Text>
          </View>
          {index < slides.length - 1 ? <Pressable accessibilityRole="button" accessibilityLabel={t("skip")} onPress={() => move(slides.length - 1)} hitSlop={12} style={{ paddingVertical: 8, paddingHorizontal: 4 }}><Text style={{ color: palette.white, fontWeight: "500", fontSize: 16, textShadowColor: "rgba(0,0,0,0.45)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } }}>{t("skip")}</Text></Pressable> : <View />}
        </View>
        <View style={{ flex: 1, justifyContent: "center" }}>
        <Animated.ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
          onMomentumScrollEnd={onScrollEnd}
          style={{ flexGrow: 0 }}
        >
          {slides.map((slide, position) => {
            const range = [(position - 1) * width, position * width, (position + 1) * width];
            // Neighbouring cards fade and shrink as they slide away, so the swipe reads as one smooth motion.
            const opacity = scrollX.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: "clamp" });
            const scale = scrollX.interpolate({ inputRange: range, outputRange: [0.9, 1, 0.9], extrapolate: "clamp" });
            return <View key={slide.title} style={{ width, justifyContent: "center", paddingHorizontal: 20 }}>
              <Animated.View style={{ opacity, transform: [{ scale }], borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" }}>
                <BlurView intensity={28} tint="light" style={{ padding: 28, gap: 14, alignItems: "center", backgroundColor: "rgba(255,248,236,0.55)" }}>
                  <Text style={{ fontFamily: serif, fontSize: 34, lineHeight: 42, fontWeight: "700", color: palette.maroon, textAlign: "center" }}>{t(slide.title)}</Text>
                  <Text style={{ color: palette.ink, fontSize: 19, lineHeight: 28, textAlign: "center" }}>{t(slide.body)}</Text>
                </BlurView>
              </Animated.View>
            </View>;
          })}
        </Animated.ScrollView>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 16 }}>{slides.map((slide, position) => {
          const range = [(position - 1) * width, position * width, (position + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange: range, outputRange: [8, 24, 8], extrapolate: "clamp" });
          return <Animated.View key={slide.title} style={{ width: dotWidth, height: 8, borderRadius: 4, backgroundColor: position === index ? palette.gold : "rgba(255,255,255,0.6)" }} />;
        })}</View>
        <View style={{ gap: 10, paddingHorizontal: 20 }}>{index < slides.length - 1 ? <Button label={t("continue")} onPress={() => move(index + 1)} /> : <><Button label={t("start")} onPress={signIn} /><Button label={t("guestMode")} onPress={guest} secondary /></>}</View>
      </View>
    </LinearGradient>
  </ImageBackground>;
}
