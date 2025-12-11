-- Remove IP address column from image_edit_usage table
ALTER TABLE public.image_edit_usage DROP COLUMN IF EXISTS ip_address;

-- Update the rate limit function to work without IP address
CREATE OR REPLACE FUNCTION public.check_image_edit_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Only check rate limit for authenticated users
  IF p_user_id IS NULL THEN
    RETURN true; -- Allow anonymous users (controlled by edge function)
  END IF;
  
  -- Count edits in the last 3 hours for this user
  SELECT COUNT(*) INTO usage_count
  FROM public.image_edit_usage
  WHERE created_at > NOW() - INTERVAL '3 hours'
    AND user_id = p_user_id;
  
  -- Return true if under limit (2 edits per 3 hours)
  RETURN usage_count < 2;
END;
$$;