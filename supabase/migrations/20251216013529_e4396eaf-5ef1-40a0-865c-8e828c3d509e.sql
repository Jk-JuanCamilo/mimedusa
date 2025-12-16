-- Add restrictive RLS policies for internal rate-limiting table
-- Goal: only the backend service role may read/write; end users get zero access.

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Optional: enforce RLS for table owners too (service_role still bypasses by design)
ALTER TABLE public.api_rate_limits FORCE ROW LEVEL SECURITY;

-- Remove any existing policies to avoid duplicates (idempotent)
DROP POLICY IF EXISTS "Service role can read rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can insert rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can delete rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can update rate limits" ON public.api_rate_limits;

-- Explicit allowlist: only service_role
CREATE POLICY "Service role can read rate limits"
ON public.api_rate_limits
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can insert rate limits"
ON public.api_rate_limits
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can delete rate limits"
ON public.api_rate_limits
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can update rate limits"
ON public.api_rate_limits
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Helpful documentation
COMMENT ON TABLE public.api_rate_limits IS 'Internal table used by backend rate limiting. Never expose to end users (anon/authenticated). Access is restricted to service_role only via RLS.';