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

// Modelos de Chat (solo los soportados por Lovable AI Gateway)
export const CHAT_MODELS: AIModel[] = [
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini Flash Lite",
    description: "Ultra rápido",
    provider: "Google"
  },
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
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    description: "Próxima generación",
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
];

// Modelos de Generación de Imágenes (usan función separada generate-image)
export const IMAGE_MODELS: AIModel[] = [
  {
    id: "google/gemini-2.5-flash-image-preview",
    name: "Gemini Flash Image",
    description: "Generación rápida de imágenes",
    provider: "Google"
  },
  {
    id: "google/gemini-3-pro-image-preview",
    name: "Gemini 3 Pro Image",
    description: "Alta calidad - Próxima gen",
    provider: "Google"
  },
];

// Solo modelos de chat para el selector principal
export const AI_MODELS: AIModel[] = [...CHAT_MODELS];

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
        <SelectTrigger className="w-[200px] h-8 text-xs bg-card/50 border-border/50">
          <SelectValue placeholder="Seleccionar modelo" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border max-h-[400px]">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
            💬 Modelos de Chat
          </div>
          {CHAT_MODELS.map((model) => (
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
