import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain } from "lucide-react";

export type AIModel = {
  id: string;
  name: string;
  description: string;
  provider: string;
};

export const AI_MODELS: AIModel[] = [
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Rápido y equilibrado",
    provider: "Google"
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Máximo razonamiento",
    provider: "Google"
  },
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini Flash Lite",
    description: "Ultra rápido",
    provider: "Google"
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    description: "Potente y preciso",
    provider: "OpenAI"
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Equilibrio costo/rendimiento",
    provider: "OpenAI"
  },
  {
    id: "openai/gpt-5-nano",
    name: "GPT-5 Nano",
    description: "Velocidad máxima",
    provider: "OpenAI"
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    description: "Inteligente y razonamiento superior",
    provider: "Anthropic"
  },
  {
    id: "claude-opus-4-1-20250805",
    name: "Claude Opus 4.1",
    description: "Más inteligente y costoso",
    provider: "Anthropic"
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Alto rendimiento",
    provider: "Anthropic"
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    description: "El más rápido de Claude",
    provider: "Anthropic"
  },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const selectedModel = AI_MODELS.find(m => m.id === value);

  return (
    <div className="flex items-center gap-2">
      <Brain className="w-4 h-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[180px] h-8 text-xs bg-card/50 border-border/50">
          <SelectValue placeholder="Seleccionar modelo" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {AI_MODELS.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id}
              className="text-xs"
            >
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {model.provider} • {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
