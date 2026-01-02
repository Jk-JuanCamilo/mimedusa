-- Drop existing overly permissive policies on api_rate_limits
DROP POLICY IF EXISTS "Service role can delete rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can insert rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can read rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Service role can update rate limits" ON public.api_rate_limits;

-- Create restrictive policies that deny ALL access to authenticated and anonymous users
-- The service role bypasses RLS by default, so it will still have full access

-- Deny SELECT for all non-service-role users (policy returns false = no access)
CREATE POLICY "Deny all user access to rate limits"
ON public.api_rate_limits
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);