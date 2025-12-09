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
    prompt: "Genera una imagen de un atardecer en la playa con palmeras y colores vibrantes"
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

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error("El archivo es muy grande. Máximo 20MB.");
      return;
    }

    setIsProcessing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      let content = "";
      let fileType = "texto";

      // Text-based files that can be read directly
      const textFormats = ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'md', 'py', 'java', 'c', 'cpp', 'h', 'sql', 'yaml', 'yml', 'ini', 'cfg', 'log', 'sh', 'bat', 'ps1', 'rb', 'php', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'lua', 'pl', 'vue', 'svelte', 'astro'];
      
      if (textFormats.includes(extension)) {
        content = await file.text();
        fileType = extension.toUpperCase();
      } else {
        // Try to read as text first for unknown formats
        try {
          const textContent = await file.text();
          // Check if it's readable text (not binary garbage)
          const isBinary = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(textContent.substring(0, 1000));
          
          if (!isBinary && textContent.length > 0) {
            content = textContent;
            fileType = extension.toUpperCase() || "TEXTO";
          } else {
            // Binary file - provide metadata
            content = `[ARCHIVO BINARIO DETECTADO]
Nombre: ${file.name}
Tipo MIME: ${file.type || 'desconocido'}
Tamaño: ${(file.size / 1024).toFixed(2)} KB
Extensión: .${extension}

NOTA: Este archivo parece ser binario (${extension}). Puedo ayudarte a:
- Describir qué tipo de archivo es
- Sugerir cómo editarlo
- Crear un nuevo archivo similar
- Proporcionar instrucciones de edición

Por favor, describe qué cambios necesitas hacer en este archivo.`;
            fileType = "BINARIO";
          }
        } catch {
          content = `[ARCHIVO: ${file.name}]
Tipo: ${file.type || 'desconocido'}
Tamaño: ${(file.size / 1024).toFixed(2)} KB

Por favor describe qué te gustaría hacer con este archivo.`;
          fileType = "DESCONOCIDO";
        }
      }

      // Truncate very long content but keep more for better context
      const maxLength = 15000;
      const truncatedContent = content.length > maxLength 
        ? content.substring(0, maxLength) + `\n\n[... contenido truncado (${content.length} caracteres totales) ...]` 
        : content;

      const prompt = fileType === "BINARIO" || fileType === "DESCONOCIDO"
        ? `He subido el archivo "${file.name}":\n\n${truncatedContent}`
        : `He subido el archivo "${file.name}" (${fileType}):\n\n\`\`\`${extension}\n${truncatedContent}\n\`\`\`\n\n¿Qué te gustaría que edite o modifique en este archivo?`;

      onAction(prompt);
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
        accept="*/*"
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
