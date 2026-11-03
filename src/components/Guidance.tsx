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

const COACH_KEY = "kendurikita_first_steps_v1";

export function FirstStepsCoach() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const steps = [
    ["wallet-outline", t("coachBudgetTitle"), t("coachBudgetBody")],
    ["people-outline", t("coachGuestTitle"), t("coachGuestBody")],
    ["mail-outline", t("coachInviteTitle"), t("coachInviteBody")],
  ] as const;
  useEffect(() => {
    void AsyncStorage.getItem(COACH_KEY).then((seen) => setVisible(!seen));
  }, []);
  const close = () => {
    void AsyncStorage.setItem(COACH_KEY, "seen");
    setVisible(false);
  };
  const next = () => {
    if (step === steps.length - 1) close();
    else setStep((current) => current + 1);
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: "rgba(39,10,20,0.45)" }}>
        <View style={{ flex: 1, justifyContent: "flex-end", padding: 20, paddingBottom: 32 }}>
          <Card>
            <View style={styles.between}>
              <Text style={styles.muted}>{t("coachProgress", { current: step + 1, total: steps.length })}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t("skip")} onPress={close}>
                <Text style={styles.label}>{t("skip")}</Text>
              </Pressable>
            </View>
            <Ionicons name={steps[step][0]} size={42} color={palette.maroon} />
            <Text style={styles.metric}>{steps[step][1]}</Text>
            <Text style={styles.muted}>{steps[step][2]}</Text>
            <Button label={step === steps.length - 1 ? t("gotIt") : t("next")} onPress={next} />
          </Card>
        </View>
      </View>
    </Modal>
  );
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
