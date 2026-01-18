import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUid(user?.uid || null);
      if (!user) {
        setConversations([]);
        setCurrentConversationId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!firebaseUid) return;
    
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase.functions.invoke("user-conversations", {
        body: { action: "list", firebaseUid }
      });

      if (error) throw error;
      setConversations(data?.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [firebaseUid]);

  // Fetch conversations when user logs in
  useEffect(() => {
    if (firebaseUid) {
      fetchConversations();
    }
  }, [firebaseUid, fetchConversations]);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    if (!firebaseUid) return [];
    
    try {
      const { data, error } = await supabase.functions.invoke("user-conversations", {
        body: { action: "getMessages", firebaseUid, conversationId }
      });

      if (error) throw error;
      return (data?.data || []).map((m: DbMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        imageUrl: m.image_url || undefined,
      }));
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error al cargar los mensajes");
      return [];
    }
  }, [firebaseUid]);

  const createConversation = useCallback(async (title: string = "Nueva conversación") => {
    if (!firebaseUid) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke("user-conversations", {
        body: { action: "create", firebaseUid, title }
      });

      if (error) throw error;
      const newConv = data?.data;
      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
        return newConv.id;
      }
      return null;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Error al crear conversación");
      return null;
    }
  }, [firebaseUid]);

  const saveMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    imageUrl?: string
  ) => {
    if (!firebaseUid) return;
    
    try {
      const { error } = await supabase.functions.invoke("user-conversations", {
        body: { action: "saveMessage", firebaseUid, conversationId, role, content, imageUrl }
      });

      if (error) throw error;

      // Update local state for title if user message
      if (role === "user") {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c
        ));
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }, [firebaseUid]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!firebaseUid) return;
    
    try {
      const { error } = await supabase.functions.invoke("user-conversations", {
        body: { action: "delete", firebaseUid, conversationId }
      });

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
  }, [firebaseUid, currentConversationId]);

  const deleteAllConversations = useCallback(async () => {
    if (!firebaseUid) return;
    
    try {
      const { error } = await supabase.functions.invoke("user-conversations", {
        body: { action: "deleteAll", firebaseUid }
      });

      if (error) throw error;
      setConversations([]);
      setCurrentConversationId(null);
      toast.success("Todo el historial ha sido eliminado");
    } catch (error) {
      console.error("Error deleting all conversations:", error);
      toast.error("Error al eliminar el historial");
    }
  }, [firebaseUid]);

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
    deleteAllConversations,
  };
}
