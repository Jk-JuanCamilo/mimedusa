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
import { ImagePlus, User, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { PDFGeneratorDialog } from "./PDFGeneratorDialog";
import { XLSXGeneratorDialog } from "./XLSXGeneratorDialog";
import { ImageEditorDialog } from "./ImageEditorDialog";

interface ActionButtonsProps {
  onAction: (action: string, fileContent?: string) => void;
  disabled?: boolean;
  userName?: string | null;
  onUserNameChange?: (name: string | null) => void;
  onSaveToHistory?: (userMessage: string, assistantMessage: string) => Promise<void>;
  isAuthenticated?: boolean;
  userId?: string;
}

const actions = [
  {
    id: "image",
    label: "Generar Imagen",
    icon: ImagePlus,
    prompt: "Genera una imagen de un atardecer en la playa con palmeras y colores vibrantes"
  },
];

export function ActionButtons({ onAction, disabled, userName, onUserNameChange, onSaveToHistory, isAuthenticated, userId }: ActionButtonsProps) {
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Sync local state with prop when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && userName) {
      setName(userName);
    } else if (!open) {
      setName("");
    }
    setIsOpen(open);
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      const newName = name.trim();
      onUserNameChange?.(newName);
      localStorage.setItem("medussa_user_name", newName);
      toast.success(`¡Hola ${newName}! Ya recordaré tu nombre.`);
      setIsOpen(false);
      setName("");
    }
  };

  const handleDeleteName = () => {
    onUserNameChange?.(null);
    localStorage.removeItem("medussa_user_name");
    toast.success("Nombre eliminado");
    setIsOpen(false);
    setName("");
  };

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
          >
            <User className="w-4 h-4" />
            <span className="text-xs">
              {userName ? `Hola, ${userName}` : "Mi Nombre"}
            </span>
            {userName && <Edit2 className="w-3 h-3 opacity-60" />}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {userName ? "Editar tu nombre" : "¿Cómo te llamas?"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {userName && (
              <p className="text-sm text-muted-foreground">
                Nombre actual: <span className="text-foreground font-medium">{userName}</span>
              </p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={userName ? "Nuevo nombre..." : "Escribe tu nombre..."}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                className="bg-background/50 border-border"
                maxLength={50}
              />
              <Button onClick={handleNameSubmit} disabled={!name.trim()}>
                {userName ? "Cambiar" : "Guardar"}
              </Button>
            </div>
            {userName && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteName}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar nombre guardado
              </Button>
            )}
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

      {/* PDF Generator */}
      <PDFGeneratorDialog 
        disabled={disabled} 
        onSaveToHistory={onSaveToHistory}
        isAuthenticated={isAuthenticated}
      />

      {/* XLSX Generator */}
      <XLSXGeneratorDialog 
        disabled={disabled} 
        onSaveToHistory={onSaveToHistory}
        isAuthenticated={isAuthenticated}
      />

      {/* Image Editor */}
      <ImageEditorDialog
        disabled={disabled}
        isAuthenticated={isAuthenticated}
        userId={userId}
      />
    </div>
  );
}
