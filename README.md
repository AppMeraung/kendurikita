# KenduriKita

KenduriKita ialah platform perancangan majlis berfokuskan Malaysia, menggunakan identiti visual maroon, emas champagne dan krim. Versi 2 menggunakan Expo Router, lima bahasa, aliran pengguna dan vendor, mod tetamu local-first serta backend Supabase dalam schema khusus `kendurikita`.

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
npm run lint
npm run build:web
npm run build:android:bundle
```

## Android / Google Play

- Package ID: `com.appmeraung.kendurikita`
- Version sumber semasa: `1.1.1`
- Release Play Console yang sedang disediakan kekal `1.0.0` (`versionCode` 2); versi 1.1 belum dihantar ke Play Store.
- Ikon 512×512: `assets/play-store-icon.png`
- Polisi privasi awam: https://appmeraung.github.io/kendurikita/index.html
- Terma & Syarat: https://appmeraung.github.io/kendurikita/terms.html
- Draf Play Console: https://play.google.com/console/u/0/developers/7680662168598881448/app/4973037187554225501/app-dashboard
- Projek EAS: https://expo.dev/accounts/meraungstudio/projects/kenduri-kita
- Profil EAS production menghasilkan Android App Bundle (`.aab`).

Build production bertandatangan memerlukan akaun Expo/EAS dan keystore Android milik penerbit. Penerbitan Google Play juga memerlukan akaun Play Console aktif, deklarasi Data Safety, polisi privasi awam dan pengisian maklumat kandungan oleh pemilik akaun.

## Data & privasi

Pengguna baharu bermula tanpa data demo. Mod tetamu menggunakan AsyncStorage; akaun awan menggunakan Supabase apabila environment disediakan. Rahsia tidak boleh disimpan dalam Git. Rujuk `SETUP.md` dan `PRIVACY.md`.

## Status produk

Status ciri dan perkara yang belum disahkan direkodkan dalam `CHANGELOG.md`. Ujian peranti fizikal, sandbox purchase, dashboard Supabase/RevenueCat dan Play Console masih wajib sebelum pelancaran umum.
