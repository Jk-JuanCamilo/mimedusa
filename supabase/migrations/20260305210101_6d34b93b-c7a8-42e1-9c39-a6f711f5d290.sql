
-- Drop messages RLS policies that depend on conversations.user_id
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;

-- Drop any remaining policies on conversations and user_preferences
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;

-- Drop foreign key constraints
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Alter columns to TEXT
ALTER TABLE public.conversations ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.user_preferences ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Create open RLS policies (edge functions use service role key)
CREATE POLICY "Allow all conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all preferences" ON public.user_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
