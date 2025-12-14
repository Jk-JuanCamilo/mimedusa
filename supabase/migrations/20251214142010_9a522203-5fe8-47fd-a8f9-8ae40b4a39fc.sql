-- Drop the redundant service_role policies
-- Service role bypasses RLS anyway, so these policies are unnecessary
-- With RLS enabled and NO policies, access is denied to anon/authenticated by default

DROP POLICY IF EXISTS "Service role can insert rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can select rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can delete rate limits" ON public.api_rate_limits;

-- RLS remains enabled, which means:
-- - service_role: can access (bypasses RLS by design)
-- - anon: denied (no matching policy)
-- - authenticated: denied (no matching policy)
-- This is the most secure configuration for an internal-only table