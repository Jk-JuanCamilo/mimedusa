-- Update check_api_rate_limit function with input validation and safe interval construction
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
  -- Validate IP address (max 45 chars for IPv6)
  IF p_ip_address IS NULL OR length(p_ip_address) > 45 OR length(p_ip_address) < 1 THEN
    RAISE EXCEPTION 'Invalid IP address';
  END IF;
  
  -- Validate endpoint (reasonable max length)
  IF p_endpoint IS NULL OR length(p_endpoint) > 100 OR length(p_endpoint) < 1 THEN
    RAISE EXCEPTION 'Invalid endpoint';
  END IF;
  
  -- Validate max_requests (reasonable bounds)
  IF p_max_requests IS NULL OR p_max_requests < 1 OR p_max_requests > 10000 THEN
    RAISE EXCEPTION 'Invalid max_requests: must be between 1 and 10000';
  END IF;
  
  -- Validate window_minutes (reasonable bounds)
  IF p_window_minutes IS NULL OR p_window_minutes < 1 OR p_window_minutes > 1440 THEN
    RAISE EXCEPTION 'Invalid window_minutes: must be between 1 and 1440';
  END IF;
  
  -- Use make_interval() to safely construct interval (prevents SQL injection)
  SELECT COUNT(*) INTO request_count
  FROM public.api_rate_limits
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND created_at > NOW() - make_interval(mins => p_window_minutes);
  
  RETURN request_count < p_max_requests;
END;
$$;

-- Update record_api_request function with input validation
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
  -- Validate IP address
  IF p_ip_address IS NULL OR length(p_ip_address) > 45 OR length(p_ip_address) < 1 THEN
    RAISE EXCEPTION 'Invalid IP address';
  END IF;
  
  -- Validate endpoint
  IF p_endpoint IS NULL OR length(p_endpoint) > 100 OR length(p_endpoint) < 1 THEN
    RAISE EXCEPTION 'Invalid endpoint';
  END IF;
  
  -- Insert record
  INSERT INTO public.api_rate_limits (ip_address, endpoint)
  VALUES (p_ip_address, p_endpoint);
  
  -- Clean up old records (older than 1 hour) to prevent table bloat
  DELETE FROM public.api_rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Update check_image_edit_rate_limit function with input validation (both overloads)
CREATE OR REPLACE FUNCTION public.check_image_edit_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Only check rate limit for authenticated users
  IF p_user_id IS NULL THEN
    RETURN true; -- Allow anonymous users (controlled by edge function)
  END IF;
  
  -- Count edits in the last 1 hour for this user
  SELECT COUNT(*) INTO usage_count
  FROM public.image_edit_usage
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND user_id = p_user_id;
  
  -- Return true if under limit (3 edits per hour)
  RETURN usage_count < 3;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_image_edit_rate_limit(p_user_id UUID, p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Validate IP address if provided
  IF p_ip_address IS NOT NULL AND (length(p_ip_address) > 45 OR length(p_ip_address) < 1) THEN
    RAISE EXCEPTION 'Invalid IP address';
  END IF;
  
  -- Count edits in the last 3 hours for this user OR IP
  SELECT COUNT(*) INTO usage_count
  FROM public.image_edit_usage
  WHERE created_at > NOW() - INTERVAL '3 hours'
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR ip_address = p_ip_address
    );
  
  -- Return true if under limit (2 edits per 3 hours)
  RETURN usage_count < 2;
END;
$$;