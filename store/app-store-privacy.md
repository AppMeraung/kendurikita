# App Store privacy-label draft

Confirm this draft against the production build in App Store Connect before submission.

## Data linked to the user

- Contact Info: name, email address and phone number — account management and app functionality.
- User Content: event details, guest contacts selected by the user, photos, documents, messages, RSVP responses and notes — app functionality.
- Purchases: digital entitlement and transaction identifiers from App Store/RevenueCat — app functionality.
- Identifiers: account ID, installation/push token and provider customer ID — app functionality and fraud prevention.

## Data not linked to the user

- No analytics or advertising SDK is intentionally configured in the current source.
- Approximate or precise location is not collected by the current source.

## Tracking and sharing

- Data is not used for cross-app tracking.
- Data is not sold.
- Supabase, RevenueCat, Apple and notification providers process data as service providers to operate requested features.

## Required App Store Connect checks

- Verify every production SDK against its privacy manifest before upload.
- Select the categories above under App Privacy and provide the public privacy-policy URL.
- Confirm account deletion is accessible in the app and at the public deletion page.
- Recheck this declaration whenever analytics, advertising, maps, payment or crash-reporting SDKs change.
