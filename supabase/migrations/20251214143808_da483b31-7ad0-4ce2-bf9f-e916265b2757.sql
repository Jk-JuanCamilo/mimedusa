-- Update the rate limit function for image editing to 4 edits per 3 hours
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
  
  -- Count edits in the last 3 hours for this user
  SELECT COUNT(*) INTO usage_count
  FROM public.image_edit_usage
  WHERE created_at > NOW() - INTERVAL '3 hours'
    AND user_id = p_user_id;
  
  -- Return true if under limit (4 edits per 3 hours)
  RETURN usage_count < 4;
END;
$function$;