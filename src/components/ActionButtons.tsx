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
import mammoth from "mammoth";

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

      // Handle Word documents (.docx)
      if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
        fileType = "WORD";
        
        const prompt = `📄 **DOCUMENTO WORD CARGADO**: "${file.name}"

**CONTENIDO DEL DOCUMENTO:**
\`\`\`
${content.substring(0, 15000)}${content.length > 15000 ? '\n\n[... contenido truncado ...]' : ''}
\`\`\`

**INSTRUCCIONES**: Analiza este documento Word. Puedo:
- ✏️ Editar secciones específicas
- 📝 Reescribir párrafos
- ✅ Corregir ortografía y gramática
- 📊 Resumir el contenido
- 🔄 Reformatear el texto

Cuando realice ediciones, te proporcionaré el documento corregido con un botón para descargarlo.

¿Qué cambios necesitas?`;

        onAction(prompt);
        toast.success(`Documento Word "${file.name}" analizado correctamente`);
      } 
      // Handle .doc files (older Word format)
      else if (extension === 'doc') {
        content = `[DOCUMENTO .DOC DETECTADO]
Nombre: ${file.name}
Tamaño: ${(file.size / 1024).toFixed(2)} KB

⚠️ El formato .doc (Word antiguo) no puede leerse directamente en el navegador.
💡 **Solución**: Guarda el archivo como .docx en Word y vuelve a subirlo.`;
        fileType = "DOC";
        onAction(content);
        toast.warning("Convierte el archivo a .docx para poder analizarlo");
      }
      // Text-based files
      else {
        const textFormats = ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'md', 'py', 'java', 'c', 'cpp', 'h', 'sql', 'yaml', 'yml', 'ini', 'cfg', 'log', 'sh', 'bat', 'ps1', 'rb', 'php', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'lua', 'pl', 'vue', 'svelte', 'astro'];
        
        if (textFormats.includes(extension)) {
          content = await file.text();
          fileType = extension.toUpperCase();
          
          const truncatedContent = content.length > 15000 
            ? content.substring(0, 15000) + `\n\n[... contenido truncado (${content.length} caracteres totales) ...]` 
            : content;

          const prompt = `📄 **ARCHIVO ${fileType} CARGADO**: "${file.name}"

\`\`\`${extension}
${truncatedContent}
\`\`\`

Puedo editar este archivo. ¿Qué cambios necesitas?`;

          onAction(prompt);
          toast.success(`Archivo "${file.name}" cargado correctamente`);
        } else {
          // Try to read as text for unknown formats
          try {
            const textContent = await file.text();
            const isBinary = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(textContent.substring(0, 1000));
            
            if (!isBinary && textContent.length > 0) {
              content = textContent;
              fileType = extension.toUpperCase() || "TEXTO";
              
              const truncatedContent = content.length > 15000 
                ? content.substring(0, 15000) + `\n\n[... contenido truncado ...]` 
                : content;

              onAction(`He subido el archivo "${file.name}" (${fileType}):\n\n\`\`\`\n${truncatedContent}\n\`\`\`\n\n¿Qué te gustaría que edite?`);
              toast.success(`Archivo "${file.name}" cargado`);
            } else {
              onAction(`[ARCHIVO BINARIO: ${file.name}]
Tipo: ${file.type || 'desconocido'}
Tamaño: ${(file.size / 1024).toFixed(2)} KB

Este archivo es binario y no puedo leer su contenido directamente. Describe qué necesitas hacer con él.`);
              toast.info("Archivo binario detectado");
            }
          } catch {
            onAction(`[ARCHIVO: ${file.name}]
Tipo: ${file.type || 'desconocido'}
Tamaño: ${(file.size / 1024).toFixed(2)} KB

Describe qué necesitas hacer con este archivo.`);
          }
        }
      }
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
