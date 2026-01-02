-- Add policy to explicitly deny access to records with NULL user_id
-- This ensures anonymous usage records are only accessible by service role

-- Drop existing policies first to recreate with proper protection
DROP POLICY IF EXISTS "Authenticated users can insert their own usage" ON public.image_edit_usage;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.image_edit_usage;

-- Recreate INSERT policy - only authenticated users can insert with their user_id
CREATE POLICY "Authenticated users can insert their own usage"
ON public.image_edit_usage
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Recreate SELECT policy - users can only view their own records (user_id must match)
CREATE POLICY "Users can view their own usage"
ON public.image_edit_usage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Explicitly deny all access to anonymous role
CREATE POLICY "Deny anonymous access to usage records"
ON public.image_edit_usage
FOR ALL
TO anon
USING (false)
WITH CHECK (false);