import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import { ActionButtons } from "./ActionButtons";
import { ModelSelector } from "./ModelSelector";
import { useToast } from "@/hooks/use-toast";

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
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInput(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            title: "Micrófono bloqueado",
            description: "Por favor permite el acceso al micrófono en tu navegador.",
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "No disponible",
        description: "Tu navegador no soporta reconocimiento de voz.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Escuchando...",
        description: "Habla ahora, tu voz se convertirá en texto.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
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
          placeholder={isListening ? "Escuchando tu voz..." : "Escribe tu mensaje..."}
          disabled={isLoading || disabled}
          className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-foreground placeholder:text-muted-foreground"
          rows={1}
        />
        <Button
          type="button"
          size="icon"
          variant={isListening ? "destructive" : "outline"}
          onClick={toggleListening}
          disabled={isLoading || disabled}
          className="flex-shrink-0 transition-all"
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
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
