-- Create table for tracking image edit usage
CREATE TABLE public.image_edit_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_edit_usage ENABLE ROW LEVEL SECURITY;

-- Policy for inserting (anyone can insert their own usage)
CREATE POLICY "Anyone can insert usage" 
ON public.image_edit_usage 
FOR INSERT 
WITH CHECK (true);

-- Policy for selecting (users can see their own, service role can see all)
CREATE POLICY "Users can view their own usage" 
ON public.image_edit_usage 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Create index for faster lookups
CREATE INDEX idx_image_edit_usage_user_id ON public.image_edit_usage(user_id);
CREATE INDEX idx_image_edit_usage_ip ON public.image_edit_usage(ip_address);
CREATE INDEX idx_image_edit_usage_created_at ON public.image_edit_usage(created_at);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_image_edit_rate_limit(
  p_user_id UUID,
  p_ip_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
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