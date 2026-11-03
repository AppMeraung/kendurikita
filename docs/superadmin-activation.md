# KenduriKita Super Admin activation

This repository supports `superadmin` after migration `202611030045_superadmin_role_guard.sql` is deployed. **No account is elevated by publishing this code.**

## Secure activation by the verified Supabase project owner

1. Verify ownership of the Supabase project and deploy migrations to a staging environment first.
2. Open the correct project's **Supabase Dashboard → Authentication → Users**. Confirm `appmeraung@gmail.com` belongs to the intended owner and the email is verified. If there is no account, have the owner sign up and verify their email via the normal login flow first.
3. Open **SQL Editor** in the same project, using the owner's privileged database session, and run:

```sql
WITH verified_account AS (
  SELECT id FROM auth.users
  WHERE lower(email) = lower('appmeraung@gmail.com')
    AND email_confirmed_at IS NOT NULL
)
UPDATE kendurikita.profiles AS p
SET role = 'superadmin', updated_at = now()
FROM verified_account AS a
WHERE p.id = a.id
RETURNING p.id, p.role, p.updated_at;
```

If this returns **zero rows**, stop. Do not create a privileged account by guessing an ID; verify the email and profile sync first. If one row is returned, sign out and sign back in to the website before opening the admin panel.

## Security checks

- An ordinary user and vendor can only set their own profile role to `user` or `vendor`.
- A user or vendor cannot escalate their own profile to `admin` or `superadmin`.
- An admin or superadmin cannot be downgraded by the standard sign-in flow.
- Marketplace moderation policies recognize both `admin` and `superadmin`.
- Promotion occurs only from a privileged database session. Never place service-role credentials in web or mobile code.

The Supabase migration, sign-in flow, and RLS tests must be verified in staging before a production release.
