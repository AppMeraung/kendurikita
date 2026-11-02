import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { userFeature } from "../../domain/entitlements";
import { supabase } from "../../services/supabase";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { Button, Card, palette, Screen, styles, Title } from "../../ui";

export default function CheckIn() {
  const { t } = useTranslation();
  const { event } = useAppState();
  const { plan, loading } = useUserPlan(event?.cloudId);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [attendance, setAttendance] = useState({ checkedIn: 0, invited: 0 });
  useEffect(() => {
    if (!event?.cloudId) return;
    const refresh = async () => {
      const { data } = await supabase
        .from("guests")
        .select("pax,checked_in_at")
        .eq("event_id", event.cloudId!);
      setAttendance({
        checkedIn: (data || []).reduce((sum, guest) => sum + (guest.checked_in_at ? guest.pax : 0), 0),
        invited: (data || []).reduce((sum, guest) => sum + guest.pax, 0),
      });
    };
    void refresh();
    const channel = supabase.channel(`check-in-${event.cloudId}`).on(
      "postgres_changes",
      { event: "UPDATE", schema: "kendurikita", table: "guests", filter: `event_id=eq.${event.cloudId}` },
      () => void refresh(),
    ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [event?.cloudId]);
  const check = async (data: string) => {
    setScanned(true);
    const token = data.split(/[/?#]/).filter(Boolean).pop() || "";
    if (!event?.cloudId) return Alert.alert(t("checkInFailed"), t("cloudRequired"));
    const { data: result, error } = await supabase.rpc("check_in_guest", {
      target_event: event.cloudId,
      p_invitation_token: token,
    });
    const row = result?.[0];
    if (row) setAttendance({ checkedIn: Number(row.checked_in_pax), invited: Number(row.invited_pax) });
    Alert.alert(
      error ? t("checkInFailed") : t("guestCheckedIn"),
      error?.message || `${row?.guest_name || ""}\n${t("attendanceRecorded")}`,
    );
  };
  if (loading) return null;
  if (!userFeature(plan, "qr"))
    return (
      <Screen>
        <Title>{t("qrCheckIn")}</Title>
        <Card>
          <Text style={styles.muted}>{t("proFeatureRequired")}</Text>
          <Button
            label={t("viewPackages")}
            onPress={() => router.push("/(user)/paywall")}
          />
        </Card>
      </Screen>
    );
  if (!permission?.granted)
    return (
      <Screen>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.label}>‹ {t("back")}</Text>
        </Pressable>
        <Title>{t("qrCheckIn")}</Title>
        <Text style={styles.muted}>{t("cameraCheckInReason")}</Text>
        <Button
          label={t("allowCamera")}
          onPress={() => void requestPermission()}
        />
      </Screen>
    );
  return (
    <View style={{ flex: 1, backgroundColor: palette.ink }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : ({ data }) => void check(data)}
      />
      <View style={{ position: "absolute", left: 20, right: 20, bottom: 40 }}>
        <Card>
          <Text style={styles.label}>{t("liveAttendance", attendance)}</Text>
        </Card>
        <Button
          label={scanned ? t("scanNext") : t("pointAtGuestQr")}
          onPress={() => setScanned(false)}
        />
      </View>
    </View>
  );
}
