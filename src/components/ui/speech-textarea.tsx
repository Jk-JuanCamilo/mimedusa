import { useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface SpeechTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SpeechTextarea({ value, onChange, placeholder, className, disabled }: SpeechTextareaProps) {
  const handleTranscript = useCallback((text: string) => {
    onChange(value + (value ? ' ' : '') + text);
  }, [value, onChange]);

  const { isListening, toggleListening } = useSpeechRecognition(handleTranscript);

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isListening ? "Escuchando tu voz..." : placeholder}
        className={className}
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        variant={isListening ? "destructive" : "outline"}
        onClick={toggleListening}
        disabled={disabled}
        className="absolute right-2 bottom-2 h-8 w-8"
        title={isListening ? "Detener dictado" : "Dictar con voz"}
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
