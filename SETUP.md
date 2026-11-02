# KenduriKita v2 setup

No secret belongs in Git. Copy `.env.example` to `.env.local` and configure EAS secrets for cloud builds.

## Required services

- Supabase project `moto`: project URL and anon key for the app; service-role key only for Edge Functions.
- Google OAuth client IDs for Android, iOS and web; register the KenduriKita deep-link callback.
- Apple Developer: Services ID, Team ID, Key ID and private key for Sign in with Apple.
- Phone OTP provider supported by the configured Supabase Auth project.
- Firebase/FCM service account for Android push and an APNs key for iOS push.
- RevenueCat public SDK keys, products, offerings and webhook secret. Entitlements must match the database configuration.
- Google Play service-account JSON for EAS Submit and the existing upload key managed by EAS. Do not create a replacement key.
- CHIP Brand ID, API key and callback public key for the optional web-only vendor payment feature. Retrieve the callback key from CHIP `GET /public_key/`; callbacks use base64 RSA PKCS#1 v1.5 SHA-256 signatures, not a shared HMAC secret.
- Public support WhatsApp number and support email for the Help/Settings contact actions.
- Google Places API (New) key stored only as the `GOOGLE_PLACES_API_KEY` Edge Function secret, with API restriction enabled.
- Vercel project variables for the public RSVP/vendor web deployment.
- AI provider URL/key as Supabase Edge Function secrets named `AI_API_URL` and `AI_API_KEY`; never add either secret to the app environment.
- Push dispatcher secret named `PUSH_FUNCTION_SECRET`. Deploy both `send-push` and `dispatch-notifications`, then schedule the dispatcher every 15 minutes from Supabase Cron using its authenticated Edge Function invocation. The dispatcher creates due reminders, atomically claims outbox jobs and retries failed jobs up to five times.

## Supabase deployment order

1. Link the intended non-production project and run all migrations in numeric order. Do not run these first against Production.
2. Run `supabase db lint` and `supabase test db` against that project/local stack, including the positive and negative RLS suite in `supabase/tests/rls.sql`.
3. Set Edge Function secrets for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUSH_FUNCTION_SECRET`, `REVENUECAT_WEBHOOK_SECRET`, `GOOGLE_PLACES_API_KEY`, `CHIP_API_KEY`, `CHIP_BRAND_ID`, `CHIP_PUBLIC_KEY`, `CHIP_VENDOR_PAYMENTS_ENABLED`, `CHIP_VENDOR_PRO_MONTH_SEN`, `CHIP_VENDOR_PRO_YEAR_SEN`, `CHIP_VENDOR_PREMIUM_MONTH_SEN`, `CHIP_VENDOR_PREMIUM_YEAR_SEN`, `PUBLIC_WEB_URL`, `AI_API_URL` and `AI_API_KEY`. Restrict the Google key to Places API (New); it remains server-side. Keep CHIP disabled until test-mode prices and credentials are verified.
4. Deploy `send-push`, `dispatch-notifications`, `revenuecat-webhook`, `create-chip-purchase`, `chip-callback`, `delete-account`, `guest-gallery-upload`, `google-places` and `ai-assistant`.
5. Add a Supabase Cron invocation for `dispatch-notifications` every 15 minutes. Confirm a test job changes from `pending` to `sent`, creates an inbox row and records the Expo ticket/receipt in `notification_log`.

## Verification required in dashboards

Before release, verify product IDs, active status, RevenueCat entitlement/offering attachment, webhook health, FCM/APNs credentials, Play upload-key SHA-1, latest Play versionCode and target track. Production rollout and live price changes require owner approval.

## Apple / TestFlight steps the owner must complete

1. Join the Apple Developer Program and register bundle ID `com.appmeraung.kendurikita` with Sign in with Apple, Push Notifications and App Groups.
2. Create the App Store Connect app and enable the same bundle ID. Do not create a second bundle ID for this project.
3. Configure the Apple provider in Supabase Auth. Add the KenduriKita callback/deep link and securely store the Team ID, Key ID and `.p8` key.
4. Add the RevenueCat iOS app, create the matching Pro/Premium products in App Store Connect, attach them to the same entitlement/offering names used by Android, and configure the webhook.
5. Create an APNs key and configure it for Expo/Supabase push delivery.
6. Review [the privacy-label draft](store/app-store-privacy.md), fill App Privacy, age rating, support URL, review contact and account-deletion details in App Store Connect.
7. Capture the required iPhone screenshots in all five languages using real release UI and no personal data. The source listing copy is in [app-store-listings.md](store/app-store-listings.md).
8. Run `npm run build:ios`. After EAS reports a successful signed archive, upload with `npm run submit:ios` only when the intended App Store Connect app and credentials have been confirmed.
9. Confirm the build appears in TestFlight, complete export-compliance questions, add internal testers and test Apple Sign-In, purchases, restore, push, widget and account deletion on a physical iPhone.

The repository cannot verify Apple agreements, certificates, product status, TestFlight processing or review state without the corresponding Apple/EAS/RevenueCat dashboard access.
