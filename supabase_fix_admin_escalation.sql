-- Security fix: privilege escalation via direct table writes.
--
-- Incident: a user set their own `is_admin` to true. Root cause is
-- architectural, not a single buggy line: the app authenticates via Firebase
-- (client-side), but talks to Supabase using only the public anon key with no
-- Supabase Auth session and no server-side identity check. Every "admin-only"
-- action in the app (staffManagementService.js: changeUserRole,
-- promoteUserToStaff, removeStaffAccess) is just a plain
-- `supabase.from('users').update(...)` call gated only by a hidden UI button.
-- Anyone can skip the UI and call the same REST endpoint directly with the
-- anon key (which ships in every page load / network tab) and no login at
-- all is required:
--
--   curl -X PATCH '<SUPABASE_URL>/rest/v1/users?id=eq.<any-id>' \
--     -H 'apikey: <anon key>' -H 'Authorization: Bearer <anon key>' \
--     -H 'Content-Type: application/json' \
--     -d '{"is_admin":true}'
--
-- This was reproduced live against production on 2026-08-10 (against a real
-- test user, immediately reverted) and confirmed to succeed unauthenticated.
--
-- Proper long-term fix is a real auth bridge (Supabase custom JWT minted
-- after verifying the Firebase ID token server-side, then RLS keyed off
-- auth.jwt()) — that's a bigger project (see notes at bottom). This migration
-- is the immediate containment: block role escalation and admin-account
-- deletion at the database level, unconditionally, regardless of RLS/grant
-- state, by checking the actual connecting Postgres role Supabase assigns to
-- anon-key/PostgREST requests ('anon' / 'authenticated'). SQL run directly by
-- an operator (Dashboard SQL Editor, service_role) connects as a different
-- role and is unaffected.
--
-- Operational impact: the "Staff Members" page's promote/demote/change-role
-- buttons will start failing (by design) until a proper authenticated admin
-- path is built. Role changes must go through the SQL Editor in the
-- meantime. Everything else (login, ordering, menu browsing, existing staff
-- day-to-day order handling) is unaffected.

CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('role', true) IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.is_admin IS TRUE OR NEW.is_staff IS TRUE THEN
        RAISE EXCEPTION 'Setting is_admin/is_staff via the public API is not allowed.';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
         OR NEW.is_staff IS DISTINCT FROM OLD.is_staff THEN
        RAISE EXCEPTION 'Changing is_admin/is_staff via the public API is not allowed. Ask a database administrator to change roles directly.';
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.is_admin IS TRUE THEN
        RAISE EXCEPTION 'Deleting an admin account via the public API is not allowed.';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON users;
CREATE TRIGGER trg_prevent_role_self_escalation
  BEFORE INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_self_escalation();

-- ---------------------------------------------------------------------------
-- NOTE FOR FOLLOW-UP (not applied by this migration — flagging, not fixing):
-- The same "any anon-key request can write anything" pattern was confirmed
-- live against menu_items (price), inventory (available_quantity), and
-- orders (status) as well — e.g. a customer could PATCH their own order to
-- status='completed' without paying, or set a menu item's price to 0, via
-- the same kind of direct REST call. Locking those down safely requires
-- replacing the app's direct-table-write flows (order status updates, menu
-- CRUD, inventory edits — see src/services/supabaseService.js,
-- menuService.js, menuManagementService.js) with authorization-checked RPCs
-- first, so staff/admin day-to-day tools don't break. Treat as a follow-up
-- project, not something to rush through the same way as this hotfix.
-- ---------------------------------------------------------------------------
