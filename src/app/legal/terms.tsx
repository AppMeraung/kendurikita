import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, palette, Screen, styles, Title } from "../../ui";

const copy = {
  en: {
    title: "KenduriKita Terms & Conditions",
    date: "Effective date: 30 October 2026",
    intro: "By downloading or using KenduriKita, you agree to these terms. If you do not agree, do not use the app.",
    sections: [
      ["Purpose of the app", "KenduriKita is an event-planning tool for managing tasks, budgets, guests, RSVPs, vendors, schedules and related information. It does not replace legal, financial or professional advice."],
      ["Your responsibilities", "You are responsible for the accuracy of information you enter, device security, necessary backups and permission to store or share information about other people. Do not use the app for unlawful, misleading, disruptive or rights-infringing activity."],
      ["Vendors and third parties", "Vendor and service information is provided to assist planning. You must perform your own checks before making a booking or payment. Dealings with vendors, sharing platforms or other third parties are between you and those parties."],
      ["Data and availability", "KenduriKita may store data locally and in configured cloud services. Device loss, app-data deletion or uninstalling may cause local data loss. We work to keep the service stable but do not guarantee uninterrupted or error-free operation on every device."],
      ["Intellectual property", "The KenduriKita name, visual identity, designs, text and software are owned by or licensed to Meraung Studio. These terms do not grant permission to copy, sell, modify or redistribute them except where allowed by law or in writing."],
      ["Limitation of liability", "To the extent permitted by law, Meraung Studio is not liable for indirect loss, data loss, vendor disputes, event-plan changes or decisions made using information in the app."],
      ["Changes and termination", "We may update the app or these terms to improve functionality, security or compliance. Access may be stopped where use breaches these terms or applicable law."],
      ["Governing law", "These terms are governed by Malaysian law, subject to applicable mandatory consumer rights."],
      ["Contact", "Questions can be sent to support@kendurikita.com."],
    ],
  },
  ms: {
    title: "Terma & Syarat KenduriKita",
    date: "Tarikh kuat kuasa: 30 Oktober 2026",
    intro: "Dengan memuat turun atau menggunakan KenduriKita, anda bersetuju dengan terma ini. Jika anda tidak bersetuju, jangan gunakan aplikasi ini.",
    sections: [
      ["Tujuan aplikasi", "KenduriKita ialah alat perancangan majlis untuk mengurus tugasan, bajet, tetamu, RSVP, vendor, jadual dan maklumat berkaitan. Aplikasi tidak menggantikan nasihat undang-undang, kewangan atau profesional."],
      ["Tanggungjawab pengguna", "Anda bertanggungjawab terhadap ketepatan maklumat yang dimasukkan, keselamatan peranti, sandaran yang diperlukan dan kebenaran untuk menyimpan atau berkongsi maklumat pihak lain."],
      ["Vendor dan pihak ketiga", "Maklumat vendor diberikan untuk membantu perancangan. Pengguna perlu membuat semakan sendiri sebelum membuat tempahan atau bayaran. Urusan dengan vendor atau pihak ketiga adalah antara pengguna dengan pihak tersebut."],
      ["Data dan ketersediaan", "KenduriKita boleh menyimpan data pada peranti dan perkhidmatan awan yang dikonfigurasi. Kehilangan peranti, pemadaman data aplikasi atau penyahpasangan boleh menyebabkan kehilangan data tempatan."],
      ["Hak harta intelek", "Nama KenduriKita, identiti visual, reka bentuk, teks dan perisian dimiliki atau dilesenkan kepada Meraung Studio."],
      ["Had liabiliti", "Setakat yang dibenarkan undang-undang, Meraung Studio tidak bertanggungjawab atas kerugian tidak langsung, kehilangan data, pertikaian vendor atau perubahan rancangan majlis."],
      ["Perubahan dan penamatan", "Kami boleh mengemas kini aplikasi atau terma bagi menambah baik fungsi, keselamatan atau pematuhan."],
      ["Undang-undang", "Terma ini ditadbir oleh undang-undang Malaysia, tertakluk pada hak pengguna mandatori yang berkenaan."],
      ["Hubungi kami", "Pertanyaan boleh dihantar ke support@kendurikita.com."],
    ],
  },
} as const;

export default function Terms() {
  const { i18n, t } = useTranslation();
  const language = i18n.language.split("-")[0] === "ms" ? "ms" : "en";
  const content = copy[language];
  return <Screen>
    <Pressable accessibilityRole="button" accessibilityLabel={t("back")} onPress={() => router.back()}><Text style={styles.label}>‹ {t("back")}</Text></Pressable>
    <View style={{ gap: 6 }}><Text style={{ color: palette.gold, fontWeight: "900" }}>KenduriKita</Text><Title>{content.title}</Title><Text style={styles.muted}>{content.date}</Text></View>
    <Card><Text style={styles.muted}>{content.intro}</Text></Card>
    {content.sections.map(([heading, body]) => <Card key={heading}><Text style={styles.label}>{heading}</Text><Text style={styles.muted}>{body}</Text></Card>)}
    <Pressable accessibilityRole="link" accessibilityLabel={t("privacyPolicy")} onPress={() => router.replace("/legal/privacy")}><Text style={{ color: palette.maroon, fontWeight: "800", textAlign: "center" }}>{t("privacyPolicy")} ›</Text></Pressable>
  </Screen>;
}
