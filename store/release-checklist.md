# Senarai semak keluaran Google Play

## Sudah disediakan

- [x] Draf aplikasi Play Console: KenduriKita
- [x] Package ID: `com.appmeraung.kendurikita`
- [x] Bahasa lalai: Melayu (Malaysia)
- [x] Model: aplikasi percuma
- [x] Ikon 512×512
- [x] Feature graphic 1024×500
- [x] Empat tangkap layar telefon 1080×1920
- [x] Penerangan ringkas dan penuh
- [x] Nota keluaran
- [x] Polisi privasi dan halaman web
- [x] Profil binaan AAB production

## Perlu diselesaikan dalam Play Console

- [x] Tetapkan URL polisi privasi awam: https://appmeraung.github.io/kendurikita/
- [ ] **App content → App access:** nyatakan bahawa sebahagian ciri memerlukan akses, walaupun perancangan setempat boleh digunakan sebagai tetamu. Sediakan [arahan capaian reviewer](#protokol-reviewer-android) dalam bahasa Inggeris untuk ciri terhad yang didayakan pada AAB calon.
- [x] Deklarasi iklan: tiada iklan
- [ ] Soal selidik penilaian kandungan
- [x] Sasaran umur: dewasa / 18+ sebagai tetapan konservatif
- [ ] Data Safety: semak pengisytiharan data terhadap AAB calon dan konfigurasi sebenar. Uji URL permintaan pemadaman akaun tanpa log masuk: https://appmeraung.github.io/kendurikita/padam-akaun.html. Dalam aplikasi: **Profil → Akaun → Padam akaun** (Akaun ialah bahagian dalam tab Profil).
- [x] Deklarasi bukan aplikasi kerajaan, kewangan atau kesihatan
- [ ] Kategori Lifestyle dan butiran hubungan rasmi
- [x] Muat naik store listing dan semua aset
- [ ] Muat naik AAB bertandatangan
- [ ] Jalankan internal testing pada peranti fizikal
- [ ] Semak pre-launch report dan selesaikan isu
- [ ] Hantar production release untuk semakan Google

Google Play boleh menambah atau mengubah keperluan ketika proses semakan. Jangan tuntut aplikasi telah diterbitkan sehingga status Console benar-benar menunjukkan tersedia di Production.

## Protokol reviewer Android

Sahkan langkah di bawah pada AAB bertandatangan yang sama dengan calon semakan. Ini ialah pelan ujian, bukan rekod akaun atau akses yang sudah tersedia. Rujukan: [Google Play App access](https://support.google.com/googleplay/android-developer/answer/15748846) dan [keperluan pemadaman akaun](https://support.google.com/googleplay/android-developer/answer/13327111).

1. **Guest, device-only:** From the final welcome slide, choose **Continue as guest**. Set up a fictional event and check the local checklist and budget. This route does not establish access to account-backed features.
2. **Signed-in customer:** From the final welcome slide, choose **Start planning**, then sign in with a dedicated, preverified test email and password. Complete the local setup if shown. In **Profile**, use **My events** to reopen the seeded fictional cloud event; on a separate fictional local event, use **Sync to account** and verify that the event reopens with its test content. Do this only against an authorized fixture.
3. **Team and paid features, if enabled:** Use dedicated customer fixtures on a fictional event to verify **Profile → Team** and team access. Verify the acceptance route using an isolated test invite without sending any email, message or invitation to a real person. A one-time or expiring invite is not durable reviewer access: prepare and validate reusable customer access to the shared event and include separately verified acceptance instructions for review. For any enabled Pro/Premium-gated feature, verify a pre-entitled reviewer fixture and give exact navigation; do not require the reviewer to buy a subscription or change entitlements during review.
4. **Deletion, separate fixture:** In a disposable signed-in account, check **Profile → Account → Delete account**, cancel once, then verify the confirmed deletion and expected access loss separately. Do not delete the reviewer account. Recheck that the public deletion link is reachable without installing the app or signing in.

Keep reviewer access reusable, valid throughout review and from any location, without OTP or a real user account. Provide the actual test login details only in the authorized Play Console **App access** field after verification, never in GitHub, screenshots or this checklist. Do not use operational accounts, real event data, or the vendor portal as a substitute for Android customer access. If an enabled flow cannot be opened with the fixture, record it as blocked rather than marking it accessible.
