-- NUTRILONGX standalone backend v1
-- Security hardening aplicado y verificado previamente en Supabase live.

alter function public.nlx_set_updated_at()
  set search_path = pg_catalog;

alter extension unaccent
  set schema extensions;
