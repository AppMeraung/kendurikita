-- Introduce a distinct owner-level Super Admin role.
-- Never promote an email automatically from a migration or client request.
ALTER TABLE kendurikita.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE kendurikita.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'vendor', 'admin', 'superadmin'));

CREATE OR REPLACE FUNCTION kendurikita.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM kendurikita.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION kendurikita.is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM kendurikita.profiles p
    WHERE p.id = auth.uid() AND p.role = 'superadmin'
  );
$$;

GRANT EXECUTE ON FUNCTION kendurikita.is_superadmin() TO authenticated;

-- Existing profiles_self RLS policy allows self-updates. Without this guard,
-- a user could attempt to assign themselves an elevated role.
-- PostgreSQL's trusted maintenance/service roles may set elevated roles,
-- but requests executed as "authenticated" must never do so.
CREATE OR REPLACE FUNCTION kendurikita.protect_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.role NOT IN ('user', 'vendor') THEN
        RAISE EXCEPTION 'privileged_role_requires_server_authorization'
          USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
      IF NEW.role NOT IN ('user', 'vendor')
         OR OLD.role NOT IN ('user', 'vendor') THEN
        RAISE EXCEPTION 'privileged_role_requires_server_authorization'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON kendurikita.profiles;
CREATE TRIGGER protect_profile_role
BEFORE INSERT OR UPDATE ON kendurikita.profiles
FOR EACH ROW EXECUTE FUNCTION kendurikita.protect_profile_role();

-- Privileged promotion must be a separate, authenticated owner action
-- in the database admin console, after verifying auth.users.email_confirmed_at.
