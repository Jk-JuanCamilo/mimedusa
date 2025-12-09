import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
  created_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((m: DbMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        imageUrl: m.image_url || undefined,
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error al cargar los mensajes");
      return [];
    }
  }, []);

  const createConversation = useCallback(async (title: string = "Nueva conversación") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;
      setConversations(prev => [data, ...prev]);
      setCurrentConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Error al crear conversación");
      return null;
    }
  }, []);

  const saveMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    imageUrl?: string
  ) => {
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        role,
        content,
        image_url: imageUrl || null,
      });

      if (error) throw error;

      // Update conversation title if first user message
      if (role === "user") {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        await supabase
          .from("conversations")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", conversationId);
        
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c
        ));
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
      }
      toast.success("Conversación eliminada");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Error al eliminar conversación");
    }
  }, [currentConversationId]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchConversations();
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchConversations();
      } else {
        setConversations([]);
        setCurrentConversationId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchConversations]);

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    isLoadingConversations,
    fetchConversations,
    loadConversationMessages,
    createConversation,
    saveMessage,
    deleteConversation,
  };
}
