-- Drop the existing INSERT policy that allows NULL user_id
DROP POLICY IF EXISTS "Authenticated users can insert their own usage" ON public.image_edit_usage;

-- Create a stricter policy - only authenticated users can insert their own records
CREATE POLICY "Authenticated users can insert their own usage" 
ON public.image_edit_usage 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());