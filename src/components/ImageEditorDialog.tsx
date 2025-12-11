import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Download, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImageEditorDialogProps {
  disabled?: boolean;
  isAuthenticated?: boolean;
  userId?: string;
}

const ACCEPTED_FORMATS = "image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif";

// Mini jellyfish component for the dialog
function MiniJellyfish({ side }: { side: 'left' | 'right' }) {
  return (
    <svg 
      viewBox="0 0 50 60" 
      className={`w-8 h-10 animate-float-slow ${side === 'left' ? 'mr-2' : 'ml-2'}`}
      style={{ 
        animationDelay: side === 'left' ? '0s' : '0.5s',
        filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))'
      }}
    >
      {/* Jellyfish body */}
      <ellipse cx="25" cy="15" rx="18" ry="12" fill="hsl(var(--primary) / 0.7)" />
      <ellipse cx="25" cy="15" rx="14" ry="9" fill="hsl(var(--primary) / 0.4)" />
      
      {/* Tentacles */}
      <path 
        d="M12 20 Q10 35 14 50" 
        stroke="hsl(var(--primary) / 0.6)" 
        strokeWidth="2" 
        fill="none"
        className="animate-tentacle"
      />
      <path 
        d="M20 22 Q18 40 22 55" 
        stroke="hsl(var(--primary) / 0.5)" 
        strokeWidth="2" 
        fill="none"
        className="animate-tentacle"
        style={{ animationDelay: '0.2s' }}
      />
      <path 
        d="M30 22 Q32 40 28 55" 
        stroke="hsl(var(--primary) / 0.5)" 
        strokeWidth="2" 
        fill="none"
        className="animate-tentacle"
        style={{ animationDelay: '0.4s' }}
      />
      <path 
        d="M38 20 Q40 35 36 50" 
        stroke="hsl(var(--primary) / 0.6)" 
        strokeWidth="2" 
        fill="none"
        className="animate-tentacle"
        style={{ animationDelay: '0.3s' }}
      />
      
      {/* Glow effect */}
      <ellipse cx="25" cy="15" rx="10" ry="6" fill="hsl(var(--primary) / 0.3)" />
    </svg>
  );
}

// Sparkle animation component
function AnimatedSparkle({ delay = 0 }: { delay?: number }) {
  return (
    <Sparkles 
      className="w-4 h-4 text-primary animate-sparkle" 
      style={{ 
        animationDelay: `${delay}s`,
        filter: 'drop-shadow(0 0 3px hsl(var(--primary)))'
      }} 
    />
  );
}

export function ImageEditorDialog({ disabled, isAuthenticated, userId }: ImageEditorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedImage(null);
    setEditedImage(null);
    setInstruction("");
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Solo se aceptan archivos de imagen");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("La imagen es muy grande. Máximo 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setEditedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleEdit = async () => {
    if (!selectedImage) {
      toast.error("Selecciona una imagen primero");
      return;
    }
    if (!instruction.trim()) {
      toast.error("Escribe qué edición quieres hacer");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await supabase.functions.invoke('edit-image', {
        body: { 
          prompt: instruction,
          imageData: selectedImage,
          userId: userId || null
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al editar la imagen");
      }

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      if (response.data.imageUrl) {
        setEditedImage(response.data.imageUrl);
        toast.success("¡Imagen editada exitosamente!");
      } else if (response.data.text) {
        toast.info(response.data.text);
      }
    } catch (error) {
      console.error("Error editing image:", error);
      toast.error(error instanceof Error ? error.message : "Error al editar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!editedImage) return;
    
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `imagen_editada_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagen descargada");
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setEditedImage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
        >
          <Wand2 className="w-4 h-4" />
          <span className="text-xs">Editar Imagen</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-center gap-1">
            <div className="flex items-center gap-1 animate-float-title">
              <AnimatedSparkle delay={0} />
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                Medussa IA Edita
              </span>
              <AnimatedSparkle delay={0.5} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          {/* Image upload/preview area */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedImage ? (
            <div className="relative">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">Original</p>
                  <img 
                    src={selectedImage} 
                    alt="Original" 
                    className="w-full h-32 object-contain rounded-lg border border-border bg-muted"
                  />
                </div>
                {editedImage && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Editada</p>
                    <img 
                      src={editedImage} 
                      alt="Editada" 
                      className="w-full h-32 object-contain rounded-lg border border-primary/50 bg-muted"
                    />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arrastra una imagen aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                JPG, PNG, GIF, WebP, BMP, TIFF, SVG
              </p>
            </div>
          )}

          {/* Edit instruction */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              ¿Qué edición quieres hacer?
            </label>
            <Textarea
              placeholder="Ej: Quita el fondo, hazla más brillante, agrega un filtro vintage..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="bg-background/50 border-border min-h-[60px]"
              maxLength={1000}
            />
          </div>

          {/* Rate limit info */}
          <p className="text-xs text-muted-foreground text-center">
            Límite: 2 ediciones cada 3 horas {isAuthenticated ? "(usuario registrado)" : "(por IP)"}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            {editedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditedImage(null)}
                  className="flex-1"
                >
                  Nueva edición
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEdit}
                disabled={isProcessing || !selectedImage || !instruction.trim()}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Editando...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Editar con IA
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
