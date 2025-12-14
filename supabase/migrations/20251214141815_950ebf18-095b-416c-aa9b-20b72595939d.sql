-- Add defensive RLS policies to api_rate_limits table
-- This table is managed by service role only, but explicit policies provide defense in depth

-- Policy: Only service role can insert (for recording API requests)
CREATE POLICY "Service role can insert rate limits"
ON public.api_rate_limits
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Only service role can select (for checking rate limits)
CREATE POLICY "Service role can select rate limits"
ON public.api_rate_limits
FOR SELECT
TO service_role
USING (true);

-- Policy: Only service role can delete (for cleanup)
CREATE POLICY "Service role can delete rate limits"
ON public.api_rate_limits
FOR DELETE
TO service_role
USING (true);

-- Deny all access to authenticated and anonymous users
-- (RLS with no matching policies already denies by default, but explicit policies are clearer)