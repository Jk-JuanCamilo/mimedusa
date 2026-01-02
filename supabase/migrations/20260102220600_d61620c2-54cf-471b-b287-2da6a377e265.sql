-- Ensure messages table has proper foreign key relationship with CASCADE DELETE
-- This ensures messages are deleted when their conversation is deleted (no orphans)

-- First, delete any orphaned messages that don't have a valid conversation
DELETE FROM public.messages 
WHERE conversation_id NOT IN (SELECT id FROM public.conversations);

-- Add foreign key constraint with ON DELETE CASCADE if it doesn't exist
-- Drop existing constraint if any (without CASCADE)
DO $$ 
BEGIN
  -- Check if foreign key exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_conversation_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE public.messages DROP CONSTRAINT messages_conversation_id_fkey;
  END IF;
END $$;

-- Add the foreign key with ON DELETE CASCADE
ALTER TABLE public.messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) 
REFERENCES public.conversations(id) 
ON DELETE CASCADE;

-- Ensure conversations.user_id cannot be NULL (if not already)
-- First check if there are any NULL user_ids and delete those conversations
DELETE FROM public.conversations WHERE user_id IS NULL;

-- Make user_id NOT NULL if it isn't already
ALTER TABLE public.conversations 
ALTER COLUMN user_id SET NOT NULL;