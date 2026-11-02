import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";
import { CompetitorBenchmark, VendorAnalytics, loadVendorAnalytics, loadVendorCompetitorBenchmark } from "../../../services/vendorAnalytics";
import { useVendorPlan } from "../../../state/usePlan";
import { Card, Screen, styles, Title } from "../../../ui";

export default function Analytics() {
  const { t } = useTranslation();
  const { plan } = useVendorPlan();
  const [data, setData] = useState<VendorAnalytics | null>(null);
  const [error, setError] = useState("");
  const [benchmark, setBenchmark] = useState<CompetitorBenchmark | null>(null);
  useEffect(() => { void Promise.resolve().then(loadVendorAnalytics).then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : t("unknownError"))); }, [t]);
  useEffect(() => { if (plan === "premium") void loadVendorCompetitorBenchmark().then(setBenchmark).catch((reason) => setError(reason instanceof Error ? reason.message : t("unknownError"))); }, [plan, t]);
  return <Screen>
    <Title>{t("vendorAnalytics")}</Title>
    {error ? <Card><Text style={styles.muted}>{error}</Text></Card> : null}
    {!data ? <Card><Text style={styles.muted}>{t("analyticsWaiting")}</Text></Card> : <>
      <Card><Text style={styles.label}>{t("profileViews")}</Text><Text style={styles.metric}>{data.views}</Text></Card>
      <Card><Text style={styles.label}>{t("enquiriesAndConversion")}</Text><Text style={styles.metric}>{data.enquiries} · {data.conversion.toFixed(1)}%</Text><Text style={styles.muted}>{t("confirmedBookings")}: {data.bookings}</Text></Card>
      {plan === "basic" ? <Card><Text style={styles.muted}>{t("upgradeFullAnalytics")}</Text></Card> : <>
        <Card><Text style={styles.label}>{t("averageResponseTime")}</Text><Text style={styles.metric}>{data.averageResponseHours == null ? "—" : `${data.averageResponseHours.toFixed(1)}h`}</Text></Card>
        <Card><Text style={styles.label}>{t("monthlyRevenue")}</Text><Text style={styles.metric}>RM {data.monthlyRevenue.toFixed(2)}</Text></Card>
        <Card><Text style={styles.label}>{t("searchRanking")}</Text><Text style={styles.muted}>{t(plan === "premium" ? "rankingSponsored" : "rankingHigher")}</Text></Card>
        <Card><Text style={styles.label}>{t("mostViewedPackages")}</Text>{data.packages.length ? data.packages.map((item) => <Text key={item.name} style={styles.muted}>{item.name} · {item.views}</Text>) : <Text style={styles.muted}>{t("noAnalyticsData")}</Text>}</Card>
        <Card><Text style={styles.label}>{t("customersByState")}</Text>{data.states.length ? data.states.map((item) => <Text key={item.name} style={styles.muted}>{item.name} · {item.customers}</Text>) : <Text style={styles.muted}>{t("noAnalyticsData")}</Text>}</Card>
        {plan === "premium" ? <Card><Text style={styles.label}>{t("competitorComparison")}</Text>{benchmark ? <><Text style={styles.muted}>{t("competitorPeerCount", { count: benchmark.peerCount })}</Text><Text style={styles.muted}>{t("competitorViews")}: {benchmark.averageMonthlyViews}</Text><Text style={styles.muted}>{t("competitorLeads")}: {benchmark.averageMonthlyLeads}</Text><Text style={styles.muted}>{t("competitorRating")}: {benchmark.averageRating?.toFixed(2) || "—"}</Text><Text style={styles.muted}>{t("competitorPrice")}: {benchmark.averageStartingPrice == null ? "—" : `RM ${benchmark.averageStartingPrice.toFixed(2)}`}</Text></> : <Text style={styles.muted}>{t("competitorNotEnoughData")}</Text>}<Text style={styles.muted}>{t("competitorComparisonPrivacy")}</Text></Card> : null}
      </>}
    </>}
  </Screen>;
}
