import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { ActionButtons } from "./ActionButtons";
import { ModelSelector } from "./ModelSelector";

interface ChatInputProps {
  onSend: (message: string, model?: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  userName?: string | null;
  onUserNameChange?: (name: string | null) => void;
  onSaveToHistory?: (userMessage: string, assistantMessage: string) => Promise<void>;
  isAuthenticated?: boolean;
  userId?: string;
}

export function ChatInput({ onSend, isLoading, disabled, selectedModel, onModelChange, userName, onUserNameChange, onSaveToHistory, isAuthenticated, userId }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim(), selectedModel);
      setInput("");
    }
  };

  const handleActionClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-3">
      {/* Model Selector */}
      <ModelSelector 
        value={selectedModel} 
        onChange={onModelChange}
        disabled={isLoading}
      />

      {/* Action Buttons */}
      <ActionButtons 
        onAction={handleActionClick} 
        disabled={isLoading || disabled}
        userName={userName}
        onUserNameChange={onUserNameChange}
        onSaveToHistory={onSaveToHistory}
        isAuthenticated={isAuthenticated}
        userId={userId}
      />

      {/* Input Area */}
      <div className="relative flex items-end gap-2 p-4 bg-muted/70 backdrop-blur-md border border-border/50 rounded-xl">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading || disabled}
          className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-foreground placeholder:text-muted-foreground"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isLoading || disabled}
          className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Presiona Enter para enviar, Shift+Enter para nueva línea
      </p>
    </form>
  );
}
