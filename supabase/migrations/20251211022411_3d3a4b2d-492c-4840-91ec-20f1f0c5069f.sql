-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can insert usage" ON public.image_edit_usage;

-- Create a more restrictive INSERT policy - only authenticated users can insert
-- and they can only insert records for themselves
CREATE POLICY "Authenticated users can insert their own usage" 
ON public.image_edit_usage 
FOR INSERT 
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) OR 
  (user_id IS NULL)
);