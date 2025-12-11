-- Update the rate limit function to 3 edits per 1 hour
CREATE OR REPLACE FUNCTION public.check_image_edit_rate_limit(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;