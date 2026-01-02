-- Add additional database-level protections for rate limiting table
-- These constraints prevent abuse even if service role is compromised

-- Add CHECK constraint to validate IP address format (basic validation)
ALTER TABLE public.api_rate_limits 
ADD CONSTRAINT valid_ip_address 
CHECK (length(ip_address) >= 1 AND length(ip_address) <= 45);

-- Add CHECK constraint to validate endpoint format
ALTER TABLE public.api_rate_limits 
ADD CONSTRAINT valid_endpoint 
CHECK (length(endpoint) >= 1 AND length(endpoint) <= 100);

-- Add index for faster rate limit queries
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup 
ON public.api_rate_limits (ip_address, endpoint, created_at DESC);

-- Add comment documenting the security design
COMMENT ON TABLE public.api_rate_limits IS 
'Rate limiting records. Only accessible by service role (edge functions). 
RLS explicitly denies access to authenticated/anonymous users. 
Service role access is intentional for backend rate limiting checks.';