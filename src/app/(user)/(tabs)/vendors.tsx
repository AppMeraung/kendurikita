import { useEffect, useState } from "react";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DiscoverableVendor, discoverVendors, toggleVendorComparison, VendorSort, vendorDistanceKm } from "../../../domain/vendorDiscovery";
import {
  recordInvoicePayment,
  respondToQuotation,
} from "../../../services/quotation";
import { cloudConfigured, supabase } from "../../../services/supabase";
import { syncEvent } from "../../../services/sync";
import { loadDiscoverableVendors } from "../../../services/vendorDiscovery";
import { loadVendorFavourites, setVendorFavourite } from "../../../services/vendorFavourites";
import { useAppState } from "../../../state/AppState";
import { ContextHelp } from "../../../components/Guidance";
import { Button, Card, Chip, Empty, Field, palette, Screen, SearchField, styles, Title } from "../../../ui";

// Stored vendor category keys (kendurikita-portal categories.js) behind the six reference rows.
const categoryRows = [
  ["venue", "business-outline", "venue"],
  ["catering", "restaurant-outline", "categoryCatering"],
  ["photo_video", "camera-outline", "categoryPhotoVideo"],
  ["attire", "shirt-outline", "categoryAttire"],
  ["decor", "flower-outline", "vendorCatDecor"],
  ["entertainment", "musical-notes-outline", "vendorCatEntertainment"],
] as const;

type Vendor = DiscoverableVendor;
type Quote = {
  id: string;
  number: string;
  total: number;
  status: string;
  items: { description: string }[];
  lead_id: string;
};
type Invoice = {
  id: string;
  number: string;
  total: number;
  status: string;
  due_at?: string;
  payments: { amount: number }[];
};

export default function Vendors() {
  const { t } = useTranslation();
  const { event, updateEvent } = useAppState();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [message, setMessage] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [state, setState] = useState("");
  const [date, setDate] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [minimumRating, setMinimumRating] = useState("");
  const [language, setLanguage] = useState("");
  const [halalOnly, setHalalOnly] = useState(false);
  const [comparison, setComparison] = useState<string[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState<VendorSort>("relevance");
  const load = async () => {
    if (!cloudConfigured) return;
    try { const [rows, saved] = await Promise.all([loadDiscoverableVendors(), loadVendorFavourites()]); setVendors(rows); setFavourites(saved); }
    catch (error) { return Alert.alert(t("vendorLoadFailed"), error instanceof Error ? error.message : t("unknownError")); }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const result = await supabase
        .from("quotations")
        .select("id,number,total,status,items,lead_id,leads!inner(sender_id)")
        .eq("leads.sender_id", user.id)
        .order("created_at", { ascending: false });
      if (!result.error) setQuotes((result.data || []) as unknown as Quote[]);
      const invoiceResult = await supabase
        .from("invoices")
        .select("id,number,total,status,due_at,payments(amount)")
        .order("due_at", { ascending: true });
      if (!invoiceResult.error)
        setInvoices((invoiceResult.data || []) as unknown as Invoice[]);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!event) return null;
  const sendLead = async () => {
    if (!selected || !message.trim()) return Alert.alert(t("required"));
    try {
      const cloudId = await syncEvent(event);
      updateEvent({ cloudId });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("signInRequired"));
      const { error } = await supabase.from("leads").insert({
        event_id: cloudId,
        vendor_id: selected.id,
        sender_id: user.id,
        message: message.trim(),
        event_snapshot: {
          name: event.name,
          date: event.date,
          type: event.type,
          venue: event.venue,
          pax: event.estimatedGuests,
          budget: event.totalBudget,
        },
      });
      if (error) throw error;
      setSelected(null);
      setMessage("");
      Alert.alert(t("vendorRequestSent"));
    } catch (error) {
      Alert.alert(
        t("vendorRequestFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const respond = async (id: string, response: "accepted" | "rejected") => {
    try {
      await respondToQuotation(id, response);
      await load();
      Alert.alert(
        t(response === "accepted" ? "quotationAccepted" : "quotationRejected"),
      );
    } catch (error) {
      Alert.alert(
        t("quotationResponseFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const recordPayment = async () => {
    const amount = Number(paymentAmount);
    if (!invoice || !Number.isFinite(amount) || amount <= 0)
      return Alert.alert(t("invalidNumber"));
    try {
      await recordInvoicePayment(invoice.id, amount, paymentMethod);
      setInvoice(null);
      setPaymentAmount("");
      await load();
      Alert.alert(t("invoicePaymentRecorded"));
    } catch (error) {
      Alert.alert(
        t("invoicePaymentFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const filteredVendors = discoverVendors(favouritesOnly ? vendors.filter((vendor) => favourites.includes(vendor.id)) : vendors, {
    query, category, state, date,
    maximumPrice: maximumPrice ? Number(maximumPrice) : undefined,
    minimumRating: minimumRating ? Number(minimumRating) : undefined,
    halal: halalOnly,
    language,
    sort,
    origin: event.venueLocation,
  });
  const comparedVendors = comparison.map((id) => vendors.find((vendor) => vendor.id === id)).filter((vendor): vendor is Vendor => Boolean(vendor));
  const toggleFavourite = async (vendorId: string) => {
    const next = !favourites.includes(vendorId);
    try { await setVendorFavourite(vendorId, next); setFavourites((current) => next ? [...current, vendorId] : current.filter((id) => id !== vendorId)); }
    catch (error) { Alert.alert(t("favouriteFailed"), error instanceof Error ? error.message : t("unknownError")); }
  };
  return (
    <Screen>
      <View style={styles.between}><Title subtitle={t("vendorsIntro")}>{t("vendorTitle")}</Title><ContextHelp title={t("vendorTitle")} body={t("vendorsHelp")} /></View>
      {quotes.length ? (
        <>
          <Title>{t("myQuotations")}</Title>
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <Text style={styles.label}>
                {quote.number} · RM {Number(quote.total).toFixed(2)}
              </Text>
              <Text style={styles.muted}>
                {t(`quotationStatus_${quote.status}`)}
              </Text>
              {quote.status === "sent" ? (
                <>
                  <Button
                    label={t("acceptQuotation")}
                    onPress={() => void respond(quote.id, "accepted")}
                  />
                  <Button
                    label={t("rejectQuotation")}
                    onPress={() => void respond(quote.id, "rejected")}
                    secondary
                  />
                </>
              ) : null}
              <Button
                label={t("openChat")}
                onPress={() => router.push(`/chat/${quote.lead_id}`)}
                secondary
              />
            </Card>
          ))}
        </>
      ) : null}
      {invoices.length ? (
        <>
          <Title>{t("myInvoices")}</Title>
          {invoices.map((item) => {
            const paid = item.payments.reduce(
              (sum, payment) => sum + Number(payment.amount),
              0,
            );
            return (
              <Card key={item.id}>
                <Text style={styles.label}>
                  {item.number} · RM {Number(item.total).toFixed(2)}
                </Text>
                <Text style={styles.muted}>
                  {t(`invoiceStatus_${item.status}`)} · {t("paid")}: RM{" "}
                  {paid.toFixed(2)} · {t("paymentOutstanding")}: RM{" "}
                  {Math.max(0, Number(item.total) - paid).toFixed(2)}
                </Text>
                {item.status !== "paid" ? (
                  <Button
                    label={t("recordInvoicePayment")}
                    onPress={() => setInvoice(item)}
                    secondary
                  />
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}
      <SearchField value={query} onChangeText={setQuery} placeholder={t("vendorSearchPlaceholder")} accessibilityLabel={t("vendorSearchPlaceholder")} />
      <Card>
        {categoryRows.map(([key, icon, label], index) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={t(label)}
            onPress={() => router.push(`/(user)/vendor-category/${key}`)}
            style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12 }]}
          >
            <Ionicons name={icon} size={22} color={palette.maroon} />
            <Text style={[styles.label, { flex: 1, fontWeight: "600" }]}>{t(label)}</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
          </Pressable>
        ))}
      </Card>
      <Button
        icon="gift-outline"
        label={t("vendorBundles")}
        onPress={() => router.push("/(user)/vendor-bundles")}
        secondary
      />
      <Button icon="options-outline" label={t("moreFilters")} onPress={() => setFiltersOpen((open) => !open)} secondary />
      {filtersOpen ? <Card>
        <Field value={category} onChangeText={setCategory} placeholder={t("vendorCategoryFilter")} />
        <Field value={state} onChangeText={setState} placeholder={t("vendorStateFilter")} />
        <Field value={date} onChangeText={setDate} placeholder={t("vendorDateFilter")} />
        <Field value={maximumPrice} onChangeText={setMaximumPrice} keyboardType="numeric" placeholder={t("vendorMaximumPrice")} />
        <Field value={minimumRating} onChangeText={setMinimumRating} keyboardType="numeric" placeholder={t("vendorMinimumRating")} />
        <Field value={language} onChangeText={setLanguage} placeholder={t("vendorLanguageFilter")} />
        <Button label={halalOnly ? t("halalOnlyOn") : t("halalOnlyOff")} onPress={() => setHalalOnly((value) => !value)} secondary={!halalOnly} />
        <Button label={favouritesOnly ? t("favouritesOnlyOn") : t("favouritesOnlyOff")} onPress={() => setFavouritesOnly((value) => !value)} secondary={!favouritesOnly} />
        <Text style={styles.label}>{t("sortVendors")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(["relevance", "rating", "price", "nearest"] as VendorSort[]).map((value) => <Chip key={value} label={t(`vendorSort_${value}`)} onPress={() => (value === "nearest" && !event.venueLocation ? undefined : setSort(value))} active={sort === value} />)}
        </View>
        {sort === "nearest" && !event.venueLocation ? <Text style={styles.muted}>{t("nearestNeedsPlace")}</Text> : null}
      </Card> : null}
      {comparedVendors.length ? <Card>
        <Text style={styles.label}>{t("vendorComparison")} ({comparedVendors.length}/3)</Text>
        {comparedVendors.map((vendor) => <Text key={vendor.id} style={styles.muted}>{vendor.companyName} · {vendor.rating.toFixed(1)}★ · {vendor.minimumPrice == null ? t("priceOnRequest") : `RM ${vendor.minimumPrice.toFixed(2)}`}</Text>)}
      </Card> : null}
      {filteredVendors.length ? (
        filteredVendors.map((vendor) => (
          <Card key={vendor.id}>
            <Text style={styles.label}>{vendor.companyName} ✓ {vendor.sponsored ? `· ${t("sponsored")}` : ""}</Text>
            <Text style={styles.muted}>{vendor.categories.join(" · ")} · {vendor.rating.toFixed(1)}★ ({vendor.reviewCount})</Text>
            <Text style={styles.muted}>{vendor.coverage.join(", ")} · {vendor.minimumPrice == null ? t("priceOnRequest") : `${t("fromPrice")} RM ${vendor.minimumPrice.toFixed(2)}`}</Text>
            {vendorDistanceKm(vendor, event.venueLocation) != null ? <Text style={styles.muted}>{t("distanceKm", { distance: vendorDistanceKm(vendor, event.venueLocation)!.toFixed(1) })}</Text> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Chip icon={favourites.includes(vendor.id) ? "heart" : "heart-outline"} label={favourites.includes(vendor.id) ? t("removeFavourite") : t("saveFavourite")} active={favourites.includes(vendor.id)} onPress={() => void toggleFavourite(vendor.id)} />
              <Chip icon="git-compare-outline" label={comparison.includes(vendor.id) ? t("removeComparison") : t("addComparison")} active={comparison.includes(vendor.id)} onPress={() => setComparison((current) => toggleVendorComparison(current, vendor.id))} />
              <Chip icon="eye-outline" label={t("viewVendorProfile")} active={false} onPress={() => router.push(`/vendor/${vendor.slug}`)} />
            </View>
            <Button
              label={t("requestBooking")}
              onPress={() => setSelected(vendor)}
            />
          </Card>
        ))
      ) : (
        <Empty
          icon="🏪"
          text={cloudConfigured ? t("emptyVendors") : t("cloudRequired")}
          action={t("refresh")}
          onPress={() => void load()}
        />
      )}
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Screen>
          <Title>{selected?.companyName}</Title>
          <Field
            value={message}
            onChangeText={setMessage}
            placeholder={t("bookingMessage")}
            multiline
          />
          <Button label={t("sendRequest")} onPress={() => void sendLead()} />
          <Button
            label={t("cancel")}
            onPress={() => setSelected(null)}
            secondary
          />
        </Screen>
      </Modal>
      <Modal
        visible={!!invoice}
        animationType="slide"
        onRequestClose={() => setInvoice(null)}
      >
        <Screen>
          <Title>{invoice?.number}</Title>
          <Field
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            placeholder={t("paymentAmount")}
            keyboardType="numeric"
          />
          <Field
            value={paymentMethod}
            onChangeText={setPaymentMethod}
            placeholder={t("paymentMethod")}
          />
          <Button
            label={t("recordInvoicePayment")}
            onPress={() => void recordPayment()}
          />
          <Button
            label={t("cancel")}
            onPress={() => setInvoice(null)}
            secondary
          />
        </Screen>
      </Modal>
    </Screen>
  );
}
