-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own usage" ON public.image_edit_usage;

-- Create a stricter SELECT policy that explicitly excludes NULL user_id records
CREATE POLICY "Users can view their own usage" 
ON public.image_edit_usage 
FOR SELECT 
TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());