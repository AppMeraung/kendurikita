# KenduriKita

KenduriKita ialah aplikasi perancangan majlis berfokuskan Malaysia, menggunakan identiti visual maroon, emas champagne dan krim. Versi 1.1 memperkenalkan reka bentuk yang dipadankan semula dengan mockup rasmi: halaman masuk berlatar pelamin, dashboard grid pastel, vendor bergambar, carta bajet, tetamu/RSVP, tetapan, navigasi lima tab serta transisi dan tindak balas sentuhan.

Modul A–Z merangkumi checklist, bajet, tetamu dan RSVP, kad jemputan, vendor, pelan meja, atur cara, pasukan, bayaran, dokumen, inventori, laporan dan aliran selepas majlis.

## Menjalankan aplikasi

```bash
npm install
npm start
```

Gunakan `npm run android`, `npm run ios` atau `npm run web` untuk platform berkaitan.

## Pengesahan

```bash
npm run typecheck
npm test
npm run build:web
npm run build:android:bundle
```

## Android / Google Play

- Package ID: `com.appmeraung.kendurikita`
- Version sumber semasa: `1.1.0` (`versionCode` 3)
- Release Play Console yang sedang disediakan kekal `1.0.0` (`versionCode` 2); versi 1.1 belum dihantar ke Play Store.
- Ikon 512×512: `assets/play-store-icon.png`
- Polisi privasi awam: https://appmeraung.github.io/kendurikita/index.html
- Terma & Syarat: https://appmeraung.github.io/kendurikita/terms.html
- Draf Play Console: https://play.google.com/console/u/0/developers/7680662168598881448/app/4973037187554225501/app-dashboard
- Projek EAS: https://expo.dev/accounts/meraungstudio/projects/kenduri-kita
- Profil EAS production menghasilkan Android App Bundle (`.aab`).

Build production bertandatangan memerlukan akaun Expo/EAS dan keystore Android milik penerbit. Penerbitan Google Play juga memerlukan akaun Play Console aktif, deklarasi Data Safety, polisi privasi awam dan pengisian maklumat kandungan oleh pemilik akaun.

## Data & privasi

Versi prototaip berfungsi ini menyimpan data demo secara setempat dengan AsyncStorage. Tiada analitik, iklan, penjejakan, pembayaran sebenar atau penghantaran data ke pelayan diaktifkan. Sebelum marketplace atau akaun awan diaktifkan, backend perlu menambah pengesahan, kawalan akses, penyulitan dan polisi retensi selaras dengan PDPA Malaysia.

## Status produk

Kod ini ialah asas aplikasi yang boleh dijalankan dan diuji. Ia tidak mendakwa bebas sepenuhnya daripada semua bug atau isu prestasi pada setiap model peranti. Ujian peranti fizikal, aksesibiliti, rangkaian perlahan dan ujian pengguna masih diperlukan sebelum pelancaran umum.
