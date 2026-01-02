-- Fix image_edit_usage RLS policies
-- Remove the restrictive policies and replace with proper permissive ones

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert their own usage" ON public.image_edit_usage;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.image_edit_usage;
DROP POLICY IF EXISTS "Deny anonymous access to usage records" ON public.image_edit_usage;

-- Create PERMISSIVE policies for authenticated users
-- SELECT: Users can view their own usage records
CREATE POLICY "Users can view their own usage"
ON public.image_edit_usage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Users can insert their own usage records (user_id must match their auth.uid())
CREATE POLICY "Users can insert their own usage"
ON public.image_edit_usage
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Note: Anonymous users have no policies = no access (RLS default deny)
-- Service role bypasses RLS for edge function insertions with NULL user_id