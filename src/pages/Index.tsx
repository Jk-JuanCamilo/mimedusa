import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { MedussaLogo } from "@/components/MedussaLogo";
import { useChat } from "@/hooks/useChat";
import { Trash2 } from "lucide-react";

const Index = () => {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-mystical">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <MedussaLogo size="sm" />
          <div>
            <h1 className="text-lg font-semibold text-gradient">Medussa IA</h1>
            <p className="text-xs text-muted-foreground">Inteligencia sin límites</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        )}
      </header>

      {/* Chat area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
            <MedussaLogo size="lg" className="mb-6" />
            <h2 className="text-2xl font-bold text-gradient mb-2">
              Bienvenido a Medussa IA
            </h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Soy una inteligencia artificial avanzada lista para ayudarte con cualquier pregunta. 
              Mi conocimiento es extenso y mis respuestas son directas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                "¿Cuál es la diferencia entre IA y Machine Learning?",
                "Explícame la teoría de la relatividad",
                "¿Cómo puedo aprender a programar?",
                "Dame consejos para mejorar mi productividad",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="p-3 text-sm text-left rounded-lg border border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto pb-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} {...message} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 p-4 rounded-lg bg-card mr-8 border border-border">
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
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
