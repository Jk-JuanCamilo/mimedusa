import { useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

interface SpeechTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function AudioWaveIndicator() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-destructive rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 12 + 4}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.4 + Math.random() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function AudioWaveAnimation() {
  return (
    <div className="absolute left-3 bottom-3 flex items-center gap-2 text-destructive">
      <div className="flex items-end gap-0.5 h-4">
        <div className="w-1 bg-destructive rounded-full animate-[wave_0.5s_ease-in-out_infinite]" style={{ height: '8px', animationDelay: '0s' }} />
        <div className="w-1 bg-destructive rounded-full animate-[wave_0.5s_ease-in-out_infinite]" style={{ height: '14px', animationDelay: '0.1s' }} />
        <div className="w-1 bg-destructive rounded-full animate-[wave_0.5s_ease-in-out_infinite]" style={{ height: '10px', animationDelay: '0.2s' }} />
        <div className="w-1 bg-destructive rounded-full animate-[wave_0.5s_ease-in-out_infinite]" style={{ height: '16px', animationDelay: '0.3s' }} />
        <div className="w-1 bg-destructive rounded-full animate-[wave_0.5s_ease-in-out_infinite]" style={{ height: '12px', animationDelay: '0.4s' }} />
      </div>
      <span className="text-xs font-medium">Escuchando...</span>
    </div>
  );
}

export function SpeechTextarea({ value, onChange, placeholder, className, disabled }: SpeechTextareaProps) {
  const handleTranscript = useCallback((text: string) => {
    onChange(value + (value ? ' ' : '') + text);
  }, [value, onChange]);

  const { isListening, toggleListening } = useSpeechRecognition(handleTranscript);

  return (
    <div className="relative">
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isListening ? "" : placeholder}
        className={cn(
          className,
          isListening && "border-destructive ring-1 ring-destructive/50 pb-10"
        )}
        disabled={disabled}
      />
      {isListening && <AudioWaveAnimation />}
      <Button
        type="button"
        size="icon"
        variant={isListening ? "destructive" : "outline"}
        onClick={toggleListening}
        disabled={disabled}
        className={cn(
          "absolute right-2 bottom-2 h-8 w-8 transition-all",
          isListening && "animate-pulse"
        )}
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
