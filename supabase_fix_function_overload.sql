-- URGENT: run immediately. supabase_atomic_order_stock_check.sql added a 6th
-- param (p_created_by) to create_order_with_items. Postgres treats a different
-- parameter list as a DIFFERENT function, so CREATE OR REPLACE did not replace
-- the old 5-arg version — it left both overloads in place. PostgREST cannot
-- pick between them, so every create_order_with_items call now fails with
-- PGRST203 ("Could not choose the best candidate function"). This breaks order
-- placement entirely until the old overload is dropped.
DROP FUNCTION IF EXISTS public.create_order_with_items(
  uuid, numeric, text, text, jsonb
);
