import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Card, palette, styles, Title } from "../ui";

export function ContextHelp({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={t("screenHelp")} onPress={() => setOpen(true)}>
        <Ionicons name="help-circle-outline" size={28} color={palette.maroon} />
      </Pressable>
      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#0008" }}>
          <Card>
            <Title>{title}</Title>
            <Text style={styles.muted}>{body}</Text>
            <Button label={t("gotIt")} onPress={() => setOpen(false)} />
          </Card>
        </View>
      </Modal>
    </>
  );
}

const COACH_KEY = "kendurikita_app_tour_v2";

type TourTab = "home" | "planning" | "vendors" | "profile";
const tourTabs: readonly (readonly [TourTab, keyof typeof Ionicons.glyphMap, string])[] = [
  ["home", "home", "home"],
  ["planning", "calendar", "planning"],
  ["vendors", "storefront", "vendors"],
  ["profile", "person", "profile"],
];

/** Step-by-step walkthrough of the Home screen and the bottom tabs, drawn as a bottom sheet with a mock tab bar. */
export function AppTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const steps: readonly (readonly [keyof typeof Ionicons.glyphMap, string, string, TourTab | null])[] = [
    ["sparkles-outline", t("tourWelcomeTitle"), t("tourWelcomeBody"), null],
    ["timer-outline", t("tourHomeTopTitle"), t("tourHomeTopBody"), "home"],
    ["flag-outline", t("tourStartHereTitle"), t("tourStartHereBody"), "home"],
    ["apps-outline", t("tourShortcutsTitle"), t("tourShortcutsBody"), "home"],
    ["calendar-outline", t("tourPlanningTabTitle"), t("tourPlanningTabBody"), "planning"],
    ["storefront-outline", t("tourVendorsTabTitle"), t("tourVendorsTabBody"), "vendors"],
    ["person-outline", t("tourProfileTabTitle"), t("tourProfileTabBody"), "profile"],
  ];
  const close = () => { setStep(0); onClose(); };
  const [icon, title, body, tab] = steps[step];
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: "rgba(39,10,20,0.45)", justifyContent: "flex-end" }}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <Card>
            <View style={styles.between}>
              <Text style={styles.muted}>{t("coachProgress", { current: step + 1, total: steps.length })}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t("skip")} onPress={close} hitSlop={10}>
                <Text style={[styles.muted, { fontWeight: "600" }]}>{t("skip")}</Text>
              </Pressable>
            </View>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={icon} size={30} color={palette.maroon} />
            </View>
            <Text style={[styles.metric, { color: palette.maroon }]}>{title}</Text>
            <Text style={[styles.muted, { fontSize: 15, lineHeight: 22 }]}>{body}</Text>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
              {steps.map((_, index) => <View key={index} style={{ width: index === step ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: index === step ? palette.gold : palette.line }} />)}
            </View>
            <View style={styles.row}>
              {step > 0 ? <View style={{ flex: 1 }}><Button label={t("back")} onPress={() => setStep((current) => current - 1)} secondary /></View> : null}
              <View style={{ flex: 1 }}><Button label={step === steps.length - 1 ? t("gotIt") : t("next")} onPress={() => (step === steps.length - 1 ? close() : setStep((current) => current + 1))} /></View>
            </View>
          </Card>
        </View>
        {tab ? (
          <View style={{ flexDirection: "row", backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 8, paddingBottom: 18 }}>
            {tourTabs.map(([key, tabIcon, label]) => {
              const active = key === tab;
              return (
                <View key={key} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                  {active ? <Ionicons name="caret-down" size={14} color={palette.gold} style={{ position: "absolute", top: -22 }} /> : null}
                  <View style={{ paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999, backgroundColor: active ? palette.rose : "transparent" }}>
                    <Ionicons name={active ? tabIcon : (`${tabIcon}-outline` as keyof typeof Ionicons.glyphMap)} size={22} color={active ? palette.maroon : palette.muted} />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: active ? "800" : "600", color: active ? palette.maroon : palette.muted }}>{t(label)}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Shows the app tour once, the first time Home opens. */
export function FirstStepsCoach() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    void AsyncStorage.getItem(COACH_KEY).then((seen) => setVisible(!seen));
  }, []);
  return <AppTour open={visible} onClose={() => { void AsyncStorage.setItem(COACH_KEY, "seen"); setVisible(false); }} />;
}

const VENDOR_COACH_KEY = "kendurikita_vendor_first_steps_v1";

export function VendorFirstStepsCoach() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    ["storefront-outline", t("vendorCoachProfileTitle"), t("vendorCoachProfileBody")],
    ["pricetags-outline", t("vendorCoachPackagesTitle"), t("vendorCoachPackagesBody")],
    ["images-outline", t("vendorCoachPortfolioTitle"), t("vendorCoachPortfolioBody")],
    ["calendar-outline", t("vendorCoachCalendarTitle"), t("vendorCoachCalendarBody")],
    ["mail-outline", t("vendorCoachLeadTitle"), t("vendorCoachLeadBody")],
  ] as const;
  useEffect(() => { void AsyncStorage.getItem(VENDOR_COACH_KEY).then((seen) => setVisible(!seen)); }, []);
  const close = () => { void AsyncStorage.setItem(VENDOR_COACH_KEY, "seen"); setVisible(false); };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}><View style={{ flex: 1, backgroundColor: "rgba(39,10,20,0.45)" }}><View style={{ flex: 1, justifyContent: "flex-end", padding: 20, paddingBottom: 32 }}><Card><View style={styles.between}><Text style={styles.muted}>{t("coachProgress", { current: step + 1, total: steps.length })}</Text><Pressable accessibilityRole="button" accessibilityLabel={t("skip")} onPress={close}><Text style={styles.label}>{t("skip")}</Text></Pressable></View><Ionicons name={steps[step][0]} size={42} color={palette.maroon} /><Text style={styles.metric}>{steps[step][1]}</Text><Text style={styles.muted}>{steps[step][2]}</Text><Button label={step === steps.length - 1 ? t("gotIt") : t("next")} onPress={() => step === steps.length - 1 ? close() : setStep((current) => current + 1)} /></Card></View></View></Modal>;
}
