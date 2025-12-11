-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own usage" ON public.image_edit_usage;

-- Create a more restrictive SELECT policy - users can ONLY see their own records
CREATE POLICY "Users can view their own usage" 
ON public.image_edit_usage 
FOR SELECT 
USING (user_id = auth.uid());