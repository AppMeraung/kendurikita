import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { budgetSummary, checklistProgress, guestSummary, money, validAmount } from "../../../domain";
import { cloudConfigured, supabase } from "../../../services/supabase";
import { loadDiscoverableVendors } from "../../../services/vendorDiscovery";
import { useAppState } from "../../../state/AppState";
import { Button, Card, Field, palette, ProgressBar, Screen, serif, styles, Tile, Title } from "../../../ui";
import { ContextHelp, FirstStepsCoach } from "../../../components/Guidance";
import { BudgetDonut } from "../../../components/BudgetDonut";
import { FloralCorner } from "../../../components/Floral";

const greetingKey = (date: Date) => (date.getHours() < 12 ? "goodMorning" : date.getHours() < 18 ? "goodAfternoon" : "goodEvening");

export default function Dashboard() {
  const { t } = useTranslation();
  const { event, addBudget, updateEvent } = useAppState();
  const [openedAt] = useState(() => new Date());
  const [quickOpen, setQuickOpen] = useState(false);
  // Guests can browse the dashboard; notifications/messages need a session or PostgREST returns 401.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!cloudConfigured) return;
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const unread = useQuery({ queryKey: ["notifications", "unread-count"], enabled: cloudConfigured && signedIn, queryFn: async () => { const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null); if (error) throw error; return count || 0; }, refetchInterval: 30000 });
  const featured = useQuery({ queryKey: ["vendors", "featured"], enabled: cloudConfigured, queryFn: async () => { const rows = (await loadDiscoverableVendors()).filter((vendor) => vendor.sponsored); return rows.length ? rows[new Date().getDate() % rows.length] : null; }, staleTime: 3600000 });
  const recentMessages = useQuery({ queryKey: ["messages", "dashboard-recent"], enabled: cloudConfigured && signedIn, queryFn: async () => { const result = await supabase.from("messages").select("id,body,created_at,lead_id,leads(vendors(company_name))").order("created_at", { ascending: false }).limit(3); if (result.error) throw result.error; return result.data || []; }, refetchInterval: 30000 });
  if (!event) return null;
  const budget = budgetSummary(event.budget, event.totalBudget);
  const guests = guestSummary(event.guests);
  const msLeft = event.date ? Math.max(0, new Date(`${event.date}T00:00:00`).getTime() - openedAt.getTime()) : null;
  const countdown = msLeft === null ? null : [[Math.floor(msLeft / 86400000), t("countDays")], [Math.floor(msLeft / 3600000) % 24, t("countHours")], [Math.floor(msLeft / 60000) % 60, t("countMinutes")]] as const;
  const progress = checklistProgress(event.checklist);
  const shortcuts = [["calendar-outline", t("planning"), "/(user)/(tabs)/planning"], ["checkbox-outline", t("checklist"), "/(user)/checklist"], ["wallet-outline", t("budget"), "/(user)/(tabs)/budget"], ["people-outline", t("guests"), "/(user)/(tabs)/guests"]] as const;
  const firstSteps = [[!!event.date, t("eventDate")], [event.totalBudget > 0, t("totalBudget")], [event.guests.length > 0, t("firstGuest")], [Boolean(event.invitation.message || event.invitation.photoUri || event.invitation.giftLink), t("invitation")], [event.team.length > 0, t("partner")]] as const;
  const firstStepRoutes = ["/(user)/events", "/(user)/(tabs)/budget", "/(user)/(tabs)/guests", "/(user)/invitation", "/(user)/team"] as const;
  const firstStepsDone = firstSteps.filter(([done]) => done).length;
  const upcomingBalances = event.budget.filter((item) => item.dueAt && item.paid < item.planned).sort((a, b) => a.dueAt!.localeCompare(b.dueAt!)).slice(0, 3);
  const quickAdd = () => {
    if (!validAmount(amount) || Number(amount) <= 0 || !category.trim()) return Alert.alert(t("invalidNumber"));
    addBudget({ category: category.trim(), name: t("quickExpense"), planned: Number(amount), paid: Number(amount), paymentType: "full", paymentMethod: "cash", payer: "shared" });
    setAmount(""); setCategory(""); setQuickOpen(false);
  };
  return <Screen>
    <FirstStepsCoach />
    <View style={styles.between}><Text style={{ color: palette.ink, fontWeight: "600" }}>{t(greetingKey(openedAt))} ☀️</Text><View style={styles.row}><ContextHelp title={t("dashboard")} body={t("dashboardHelp")} /><Pressable accessibilityRole="button" accessibilityLabel={t("notifications")} onPress={() => router.push("/(user)/notifications")} style={{ position: "relative" }}><Ionicons name="notifications-outline" size={26} color={palette.maroon} />{unread.data ? <View style={{ position: "absolute", right: -8, top: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: palette.danger, alignItems: "center", justifyContent: "center" }}><Text style={{ color: palette.white, fontSize: 11, fontWeight: "800" }}>{unread.data > 99 ? "99+" : unread.data}</Text></View> : null}</Pressable></View></View>
    <Title>{event.name}</Title>
    <Card>
      <View style={{ position: "absolute", right: -4, top: -6, opacity: 0.9 }} pointerEvents="none"><FloralCorner size={78} flip /></View>
      <View style={styles.row}><Ionicons name="calendar-outline" size={18} color={palette.maroon} /><Text style={[styles.label, { color: palette.maroon }]}>{t("eventCountdown")}</Text></View>
      {countdown ? <View style={{ flexDirection: "row", gap: 10 }}>{countdown.map(([value, label]) => <View key={label} style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.cream }}><Text style={{ fontFamily: serif, fontSize: 28, fontWeight: "700", color: palette.maroon }}>{value}</Text><Text style={[styles.muted, { fontSize: 12 }]}>{label}</Text></View>)}</View> : <Text style={styles.metric}>{t("notSet")}</Text>}
      <Text style={styles.muted}>{event.type} · {event.date || t("notSet")} · {event.venue || t("notSet")}</Text>
    </Card>
    <Card>
      <View style={styles.between}><Text style={styles.label}>{t("planningProgress")}</Text><Text style={[styles.label, { color: palette.maroon }]}>{progress}%</Text></View>
      <ProgressBar value={progress / 100} />
      <Text style={styles.muted}>{money(budget.paid, event.country)} · {t("guests")} {guests.confirmed}/{guests.total}</Text>
    </Card>
    <View style={styles.grid}>{shortcuts.map(([icon, label, href]) => <Tile key={label} icon={icon} label={label} onPress={() => router.push(href)} />)}</View>
    <Pressable accessibilityRole="button" accessibilityLabel={t("howToUseApp")} onPress={() => router.push("/(user)/help")}>
      <Card><View style={styles.row}><View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center" }}><Ionicons name="map-outline" size={25} color={palette.maroon} /></View><View style={{ flex: 1 }}><Text style={styles.label}>{t("howToUseApp")}</Text><Text style={styles.muted}>{t("howToUseAppBody")}</Text></View><Ionicons name="chevron-forward" size={22} color={palette.maroon} /></View></Card>
    </Pressable>
    <Button label={t("quickAddExpense")} onPress={() => setQuickOpen(true)} />
    {featured.data ? <Pressable accessibilityLabel={t("viewVendorProfile")} onPress={() => router.push(`/vendor/${featured.data!.slug}`)}><Card><Text style={styles.label}>{t("featuredVendor")} · {t("sponsored")}</Text><Text style={styles.metric}>{featured.data.companyName}</Text><Text style={styles.muted}>{featured.data.rating.toFixed(1)}★ · {featured.data.categories.join(" · ")}</Text></Card></Pressable> : null}
    {upcomingBalances.length ? <Card><Text style={styles.label}>{t("upcomingBalances")}</Text>{upcomingBalances.map((item) => <Text key={item.id} style={styles.muted}>{item.dueAt} · {item.vendor || item.name} · {money(item.planned - item.paid, event.country)}</Text>)}</Card> : null}
    {recentMessages.data?.length ? <Card><Text style={styles.label}>{t("recentVendorMessages")}</Text>{recentMessages.data.map((message) => { const lead = Array.isArray(message.leads) ? message.leads[0] : message.leads; const vendor = Array.isArray(lead?.vendors) ? lead?.vendors[0] : lead?.vendors; return <Pressable key={message.id} accessibilityLabel={t("openChat")} onPress={() => router.push(`/chat/${message.lead_id}`)}><Text style={styles.muted}>{vendor?.company_name || t("vendor")} · {message.body || t("attachment")}</Text></Pressable>; })}</Card> : null}
    {!event.gettingStartedDismissed && firstStepsDone < firstSteps.length ? <Card><View style={styles.between}><View><Text style={styles.label}>{t("gettingStarted")}</Text><Text style={styles.muted}>{t("tapStepHint")}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={t("dismissGettingStarted")} onPress={() => updateEvent({ gettingStartedDismissed: true })}><Ionicons name="close" size={24} color={palette.muted} /></Pressable></View><BudgetDonut paid={firstStepsDone} total={firstSteps.length} label={t("complete")} />{firstSteps.map(([done, label], index) => <Pressable key={`${label}`} accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(firstStepRoutes[index])} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, backgroundColor: pressed ? palette.rose : palette.cream })}><Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={22} color={done ? palette.maroon : palette.muted} /><Text style={[styles.label, { flex: 1, color: done ? palette.muted : palette.ink }]}>{index + 1}. {label}</Text><Ionicons name="chevron-forward" size={20} color={palette.maroon} /></Pressable>)}</Card> : null}
    <Card><Text style={styles.label}>{event.checklist.filter((item) => !item.done).slice(0, 3).map((item) => item.title).join("\n") || t("emptyTasks")}</Text><Text onPress={() => router.push("/(user)/checklist")} style={{ color: palette.maroon, fontWeight: "800" }}>{t("checklist")}</Text><Text onPress={() => router.push("/(user)/(tabs)/budget")} style={{ color: palette.maroon, fontWeight: "800" }}>{t("addExpense")}</Text></Card>
    <Modal visible={quickOpen} animationType="slide" onRequestClose={() => setQuickOpen(false)}><Screen><Title>{t("quickAddExpense")}</Title><Field value={amount} onChangeText={setAmount} placeholder={t("amountPaid")} keyboardType="numeric" /><Field value={category} onChangeText={setCategory} placeholder={t("category")} /><Button label={t("save")} onPress={quickAdd} /><Button label={t("cancel")} onPress={() => setQuickOpen(false)} secondary /></Screen></Modal>
  </Screen>;
}
