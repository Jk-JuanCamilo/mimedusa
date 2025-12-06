import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImagePlus, Globe, Code, User } from "lucide-react";

interface ActionButtonsProps {
  onAction: (action: string) => void;
  disabled?: boolean;
}

const actions = [
  {
    id: "image",
    label: "Generar Imagen",
    icon: ImagePlus,
    prompt: "Genera una imagen de "
  },
  {
    id: "web",
    label: "Búsqueda Web",
    icon: Globe,
    prompt: "Busca en la web información sobre "
  },
  {
    id: "code",
    label: "Crear App/Web",
    icon: Code,
    prompt: "Ayúdame a crear una aplicación o sitio web para "
  },
];

export function ActionButtons({ onAction, disabled }: ActionButtonsProps) {
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleNameSubmit = () => {
    if (name.trim()) {
      onAction(`Hola, mi nombre es ${name.trim()}. Recuérdalo para responderme de forma personalizada.`);
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
          >
            <User className="w-4 h-4" />
            <span className="text-xs">Mi Nombre</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">¿Cómo te llamas?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Escribe tu nombre..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="bg-background/50 border-border"
              maxLength={50}
            />
            <Button onClick={handleNameSubmit} disabled={!name.trim()}>
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          onClick={() => onAction(action.prompt)}
          disabled={disabled}
          className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
        >
          <action.icon className="w-4 h-4" />
          <span className="text-xs">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
