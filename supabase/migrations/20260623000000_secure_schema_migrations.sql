-- schema_migrations is a bookkeeping table; app clients have no business reading it.
-- Enable RLS so PostgREST cannot return rows without an explicit policy.
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

-- Revoke any SELECT/INSERT/UPDATE/DELETE that public (and therefore anon/authenticated) inherited.
REVOKE ALL ON public.schema_migrations FROM anon, authenticated;
