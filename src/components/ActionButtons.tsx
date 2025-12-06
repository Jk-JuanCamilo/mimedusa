import { Button } from "@/components/ui/button";
import { ImagePlus, Globe, Code, User } from "lucide-react";

interface ActionButtonsProps {
  onAction: (action: string) => void;
  disabled?: boolean;
}

const actions = [
  {
    id: "name",
    label: "Mi Nombre",
    icon: User,
    prompt: "Hola, mi nombre es "
  },
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
  return (
    <div className="flex flex-wrap gap-2 mb-3">
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
