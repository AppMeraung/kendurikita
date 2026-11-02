import { useKeepAwake } from "expo-keep-awake";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { liveTimeline } from "../../domain/dayMode";
import { planAllows } from "../../domain/plans";
import { resolveUserPlan } from "../../services/plans";
import { cloudConfigured, supabase } from "../../services/supabase";
import { useAppState } from "../../state/AppState";
import { Button, Card, Field, Screen, styles, Title } from "../../ui";

export default function DayMode() {
  useKeepAwake();
  const { t } = useTranslation();
  const { event, addRecord, deleteRecord, updateEvent } = useAppState();
  const [plan, setPlan] = useState<"basic" | "pro" | "premium">("basic");
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [attendance, setAttendance] = useState(0);
  useEffect(() => {
    void resolveUserPlan()
      .then(setPlan)
      .finally(() => setReady(true));
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!event?.cloudId || !cloudConfigured) return;
    const refresh = async () => {
      const [guestResult, leadResult] = await Promise.all([
        supabase.from("guests").select("pax,checked_in_at").eq("event_id", event.cloudId!),
        supabase.from("leads").select("vendor_id,vendors(company_name,phone)").eq("event_id", event.cloudId!).eq("status", "confirmed"),
      ]);
      if (!guestResult.error) setAttendance((guestResult.data || []).reduce((sum, guest) => sum + (guest.checked_in_at ? guest.pax : 0), 0));
      if (!leadResult.error) {
        const vendors = (leadResult.data || []).map((lead) => {
          const vendor = Array.isArray(lead.vendors) ? lead.vendors[0] : lead.vendors;
          return { id: lead.vendor_id, name: vendor?.company_name || "Vendor", phone: vendor?.phone || "" };
        }).filter((vendor) => vendor.phone);
        updateEvent({ dayVendors: vendors });
      }
    };
    void refresh();
    const channel = supabase.channel(`day-mode-${event.cloudId}`).on("postgres_changes", { event: "UPDATE", schema: "kendurikita", table: "guests", filter: `event_id=eq.${event.cloudId}` }, () => void refresh()).subscribe();
    return () => { void supabase.removeChannel(channel); };
    // updateEvent intentionally omitted: the cached contacts update app state and would otherwise restart this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.cloudId]);
  const live = useMemo(
    () => liveTimeline(event?.timeline || [], now),
    [event?.timeline, now],
  );
  if (!event) return null;
  if (!ready)
    return (
      <Screen>
        <Text style={styles.muted}>{t("loading")}</Text>
      </Screen>
    );
  if (!planAllows(plan, "pro"))
    return (
      <Screen>
        <Title>{t("dayMode")}</Title>
        <Card>
          <Text style={styles.muted}>{t("proFeatureRequired")}</Text>
          <Button
            label={t("viewPackages")}
            onPress={() => router.push("/(user)/paywall")}
          />
        </Card>
      </Screen>
    );
  const notes = event.records.day_notes || [];
  return (
    <Screen>
      <Title>{t("dayMode")}</Title>
      <Card>
        <Text style={styles.label}>{t("currentItem")}</Text>
        <Text style={[styles.metric, { fontSize: 32 }]}>
          {live.current?.title || t("none")}
        </Text>
        <Text style={styles.muted}>
          {live.current
            ? `${live.current.start}–${live.current.end}`
            : t("noCurrentItem")}
        </Text>
      </Card>
      <Card>
        <Text style={styles.label}>{t("nextItem")}</Text>
        <Text style={[styles.metric, { fontSize: 28 }]}>
          {live.next?.title || t("none")}
        </Text>
        {live.next ? <Text style={styles.muted}>{live.next.start}</Text> : null}
      </Card>
      <Button
        label={t("openQrCheckIn", { count: attendance })}
        onPress={() => router.push("/(user)/check-in")}
      />
      <Title>{t("dayContacts")}</Title>
      {event.team
        .filter((member) => member.phone)
        .map((member) => (
          <Card key={member.id}>
            <Text style={styles.label}>
              {member.name} ·{" "}
              {t(`role${member.role[0].toUpperCase()}${member.role.slice(1)}`)}
            </Text>
            <View style={styles.row}>
              <Button
                label={t("call")}
                onPress={() => void Linking.openURL(`tel:${member.phone}`)}
              />
              <Button
                label="WhatsApp"
                onPress={() =>
                  void Linking.openURL(
                    `https://wa.me/${member.phone?.replace(/\D/g, "")}`,
                  )
                }
                secondary
              />
            </View>
          </Card>
        ))}
      {(event.dayVendors || []).map((vendor) => (
        <Card key={vendor.id}>
          <Text style={styles.label}>{vendor.name} · {t("vendor")}</Text>
          <View style={styles.row}>
            <Button label={t("call")} onPress={() => void Linking.openURL(`tel:${vendor.phone}`)} />
            <Button label="WhatsApp" onPress={() => void Linking.openURL(`https://wa.me/${vendor.phone.replace(/\D/g, "")}`)} secondary />
          </View>
        </Card>
      ))}
      <Title>{t("sharedNotes")}</Title>
      <Field
        value={note}
        onChangeText={setNote}
        placeholder={t("addNote")}
        multiline
      />
      <Button
        label={t("addNote")}
        onPress={() => {
          if (!note.trim()) return;
          addRecord("day_notes", {
            title: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            detail: note.trim(),
          });
          setNote("");
        }}
      />
      {notes.map((item) => (
        <Card key={item.id}>
          <Text style={styles.label}>{item.title}</Text>
          <Text style={styles.muted}>{item.detail}</Text>
          <Button
            label={t("delete")}
            onPress={() => deleteRecord("day_notes", item.id)}
            secondary
          />
        </Card>
      ))}
    </Screen>
  );
}
