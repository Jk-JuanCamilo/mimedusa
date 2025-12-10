import { useEffect, useRef, lazy, Suspense, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { MedussaLogo } from "@/components/MedussaLogo";
import { AuthButton } from "@/components/AuthButton";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { Trash2, History, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Lazy load non-critical visual components
const CircuitBackground = lazy(() => import("@/components/CircuitBackground").then(m => ({ default: m.CircuitBackground })));
const FloatingJellyfish = lazy(() => import("@/components/FloatingJellyfish").then(m => ({ default: m.FloatingJellyfish })));

const Index = () => {
  const [user, setUser] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    loadConversationMessages,
    createConversation,
    saveMessage,
    deleteConversation,
  } = useConversations();

  const conversationIdRef = useRef<string | null>(null);
  
  const handleMessageComplete = useCallback(async (
    role: "user" | "assistant",
    content: string,
    imageUrl?: string
  ) => {
    if (!user) return;
    
    let convId = conversationIdRef.current;
    
    // Create conversation on first user message
    if (!convId && role === "user") {
      convId = await createConversation(content.slice(0, 50));
      conversationIdRef.current = convId;
    }
    
    if (convId) {
      await saveMessage(convId, role, content, imageUrl);
    }
  }, [user, createConversation, saveMessage]);

  const {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    selectedModel,
    setSelectedModel,
    setMessages,
    userName,
    setUserName
  } = useChat({ onMessageComplete: handleMessageComplete });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update ref when currentConversationId changes
  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(!!authUser);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Auto-scroll siempre que hay nuevos mensajes o el asistente está escribiendo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSelectConversation = async (id: string) => {
    const loadedMessages = await loadConversationMessages(id);
    setMessages(loadedMessages);
    setCurrentConversationId(id);
    setSidebarOpen(false);
  };

  const handleNewConversation = () => {
    clearChat();
    setCurrentConversationId(null);
    conversationIdRef.current = null;
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      clearChat();
      conversationIdRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Animated Circuit Background - lazy loaded */}
      <Suspense fallback={null}>
        <CircuitBackground />
      </Suspense>
      
      {/* Floating Jellyfish - lazy loaded */}
      <Suspense fallback={null}>
        <FloatingJellyfish />
      </Suspense>

      {/* Conversation Sidebar */}
      {user && (
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Content overlay */}
      <div className="flex flex-col h-full relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {user && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-muted-foreground"
              >
                <History className="w-5 h-5" />
              </Button>
            )}
            <MedussaLogo size="sm" />
            <div>
              <h1 className="text-lg font-semibold text-gradient">Medussa IA</h1>
              <p className="text-xs text-muted-foreground">Inteligencia sin límites</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && messages.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNewConversation}
                className="text-muted-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva
              </Button>
            )}
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            )}
            <AuthButton />
          </div>
        </header>

        {/* Chat area */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[30vh] text-center px-4">
              <MedussaLogo size="lg" className="mb-6" />
              <h2 className="text-2xl font-bold text-gradient mb-2">Medussa IA</h2>
              <p className="text-muted-foreground max-w-md">
                Soy una inteligencia artificial avanzada lista para ayudarte con cualquier pregunta. Mi conocimiento es extenso
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto pb-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} {...message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 p-4 rounded-lg bg-card/60 backdrop-blur-sm mr-8 border border-border/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-accent/20 text-accent">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t border-border/50 bg-background/60 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            <ChatInput 
              onSend={sendMessage} 
              isLoading={isLoading}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              userName={userName}
              onUserNameChange={setUserName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
