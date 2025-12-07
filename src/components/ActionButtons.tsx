import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImagePlus, Globe, Code, User, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ActionButtonsProps {
  onAction: (action: string, fileContent?: string) => void;
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
    prompt: "Busca información sobre "
  },
  {
    id: "code",
    label: "Crear App/Web",
    icon: Code,
    prompt: "Quiero crear una aplicación o sitio web para "
  },
];

export function ActionButtons({ onAction, disabled }: ActionButtonsProps) {
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameSubmit = () => {
    if (name.trim()) {
      onAction(`Hola, mi nombre es ${name.trim()}. Recuérdalo para responderme de forma personalizada.`);
      setIsOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("El archivo es muy grande. Máximo 10MB.");
      return;
    }

    setIsProcessing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let content = "";

      if (['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'md'].includes(extension || '')) {
        // Read as text for plain text files
        content = await file.text();
      } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) {
        // For binary files, read as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        content = `[Archivo: ${file.name}]\nTipo: ${file.type}\nTamaño: ${(file.size / 1024).toFixed(2)} KB\n\nNota: Este es un archivo binario (${extension}). Por favor describe qué te gustaría que haga con este archivo.`;
      } else {
        // Other files
        content = await file.text().catch(() => 
          `[Archivo: ${file.name}] - Tipo: ${file.type || 'desconocido'}`
        );
      }

      const truncatedContent = content.length > 5000 
        ? content.substring(0, 5000) + "\n\n[... contenido truncado por longitud ...]" 
        : content;

      onAction(`He subido el archivo "${file.name}":\n\n${truncatedContent}\n\n¿Qué te gustaría que haga con este archivo?`);
      toast.success(`Archivo "${file.name}" cargado correctamente`);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Error al leer el archivo");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      {/* File Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.xml,.md,.ppt,.pptx"
        onChange={handleFileUpload}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isProcessing}
        className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileUp className="w-4 h-4" />
        )}
        <span className="text-xs">Subir Archivo</span>
      </Button>
    </div>
  );
}
