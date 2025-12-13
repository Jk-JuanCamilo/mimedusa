-- Create table for tracking API rate limits by IP
CREATE TABLE public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_api_rate_limits_ip_endpoint ON public.api_rate_limits (ip_address, endpoint, created_at);

-- Enable RLS (but allow service role to manage)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create function to check rate limit (returns true if allowed, false if rate limited)
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_ip_address TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 20,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*) INTO request_count
  FROM public.api_rate_limits
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Return true if under limit
  RETURN request_count < p_max_requests;
END;
$$;

-- Create function to record API request
CREATE OR REPLACE FUNCTION public.record_api_request(
  p_ip_address TEXT,
  p_endpoint TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.api_rate_limits (ip_address, endpoint)
  VALUES (p_ip_address, p_endpoint);
  
  -- Clean up old records (older than 1 hour) to prevent table bloat
  DELETE FROM public.api_rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;