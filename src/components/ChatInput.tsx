import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Mic, MicOff, Plus, X, Image } from "lucide-react";
import { ActionButtons } from "./ActionButtons";
import { ModelSelector } from "./ModelSelector";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string, model?: string, imageData?: string) => void;
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

// Componente de ondas de audio animadas
function AudioWaveAnimation() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-destructive/10 rounded-lg border border-destructive/30">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-destructive rounded-full animate-pulse"
            style={{
              height: `${12 + Math.random() * 12}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.4 + Math.random() * 0.3}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-destructive font-medium ml-2">Escuchando...</span>
    </div>
  );
}

export function ChatInput({ onSend, isLoading, disabled, selectedModel, onModelChange, userName, onUserNameChange, onSaveToHistory, isAuthenticated, userId }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>([3, 5, 8, 5, 3]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Animar ondas mientras escucha
  useEffect(() => {
    if (isListening) {
      const animate = () => {
        setAudioLevel(prev => prev.map(() => 3 + Math.random() * 20));
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevel([3, 5, 8, 5, 3]);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo no válido",
        description: "Por favor selecciona una imagen (JPG, PNG, WEBP, GIF).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Imagen muy grande",
        description: "La imagen debe ser menor a 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setAttachedImage(base64);
      setImagePreview(base64);
      toast({
        title: "Imagen adjuntada",
        description: "La imagen se enviará con tu mensaje.",
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachedImage) && !isLoading && !disabled) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      const message = input.trim() || (attachedImage ? "Analiza esta imagen" : "");
      onSend(message, selectedModel, attachedImage || undefined);
      setInput("");
      setAttachedImage(null);
      setImagePreview(null);
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

      {/* Audio Wave Indicator when listening */}
      {isListening && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-0.5 h-8">
            {audioLevel.map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-destructive rounded-full transition-all duration-75"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
          <span className="text-sm text-destructive font-medium animate-pulse">
            Escuchando tu voz...
          </span>
          <div className="flex items-center gap-0.5 h-8">
            {audioLevel.slice().reverse().map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-destructive rounded-full transition-all duration-75"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Imagen adjunta" 
            className="max-h-32 rounded-lg border border-border/50"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className={cn(
        "relative flex items-end gap-2 p-4 bg-muted/70 backdrop-blur-md border rounded-xl transition-all",
        isListening 
          ? "border-destructive/50 ring-2 ring-destructive/20" 
          : attachedImage
            ? "border-primary/50 ring-2 ring-primary/20"
            : "border-border/50"
      )}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* Attach image button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || disabled}
          className="flex-shrink-0 transition-all"
          title="Adjuntar imagen"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Escuchando tu voz..." : attachedImage ? "Describe qué quieres saber de la imagen..." : "Escribe tu mensaje..."}
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
          className={cn(
            "flex-shrink-0 transition-all",
            isListening && "animate-pulse"
          )}
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
          disabled={(!input.trim() && !attachedImage) || isLoading || disabled}
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
