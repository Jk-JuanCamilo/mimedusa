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
import { Wand2, Loader2, Download, X, Image as ImageIcon, Sparkles, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ImageEditorDialogProps {
  disabled?: boolean;
  isAuthenticated?: boolean;
  userId?: string;
}

const ACCEPTED_FORMATS = "image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif";

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

type Mode = "generate" | "edit";

export function ImageEditorDialog({ disabled, isAuthenticated, userId }: ImageEditorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("generate");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedImage(null);
    setResultImage(null);
    setPrompt("");
    setMode("generate");
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
      setResultImage(null);
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

  const handleProcess = async () => {
    if (!prompt.trim()) {
      toast.error(mode === "generate" ? "Describe qué imagen quieres crear" : "Escribe qué edición quieres hacer");
      return;
    }

    if (mode === "edit" && !selectedImage) {
      toast.error("Selecciona una imagen para editar");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await supabase.functions.invoke('edit-image', {
        body: { 
          prompt: prompt,
          imageData: mode === "edit" ? selectedImage : null,
          userId: userId || null,
          mode: mode
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al procesar la solicitud");
      }

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      if (response.data.imageUrl) {
        setResultImage(response.data.imageUrl);
        toast.success(mode === "generate" ? "¡Imagen creada exitosamente!" : "¡Imagen editada exitosamente!");
      } else if (response.data.text) {
        toast.info(response.data.text);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `medussa_${mode === "generate" ? "creada" : "editada"}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Imagen descargada");
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setResultImage(null);
  };

  const handleNewImage = () => {
    setResultImage(null);
    if (mode === "generate") {
      setPrompt("");
    }
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
          <span className="text-xs">Crear/Editar Imagen</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-center gap-1">
            <div className="flex items-center gap-1 animate-float-title">
              <AnimatedSparkle delay={0} />
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                Medussa IA {mode === "generate" ? "Crea" : "Edita"}
              </span>
              <AnimatedSparkle delay={0.5} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-2">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === "generate" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("generate");
                setSelectedImage(null);
                setResultImage(null);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Nueva
            </Button>
            <Button
              variant={mode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("edit");
                setResultImage(null);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Editar Imagen
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Content based on mode */}
          {mode === "edit" && (
            <>
              {selectedImage ? (
                <div className="relative">
                  <div className={`grid ${resultImage ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground text-center">Original</p>
                      <img 
                        src={selectedImage} 
                        alt="Original" 
                        className="w-full h-32 object-contain rounded-lg border border-border bg-muted"
                      />
                    </div>
                    {resultImage && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground text-center">Editada</p>
                        <img 
                          src={resultImage} 
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
            </>
          )}

          {/* Generated image preview */}
          {mode === "generate" && resultImage && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground text-center">Imagen Creada</p>
              <img 
                src={resultImage} 
                alt="Generada" 
                className="w-full h-48 object-contain rounded-lg border border-primary/50 bg-muted"
              />
            </div>
          )}

          {/* Prompt input */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">
              {mode === "generate" ? "¿Qué imagen quieres crear?" : "¿Qué edición quieres hacer?"}
            </label>
            <Textarea
              placeholder={
                mode === "generate" 
                  ? "Ej: Un atardecer en la playa con palmeras, un gato astronauta en el espacio..." 
                  : "Ej: Quita el fondo, hazla más brillante, agrega un filtro vintage..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-background/50 border-border min-h-[70px]"
              maxLength={1000}
            />
          </div>

          {/* Rate limit info */}
          <p className="text-xs text-muted-foreground text-center">
            Límite: 4 usos cada 3 horas {isAuthenticated ? "(usuario registrado)" : "(por IP)"}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            {resultImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleNewImage}
                  className="flex-1"
                >
                  {mode === "generate" ? "Nueva creación" : "Nueva edición"}
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
                onClick={handleProcess}
                disabled={isProcessing || !prompt.trim() || (mode === "edit" && !selectedImage)}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "generate" ? "Creando..." : "Editando..."}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {mode === "generate" ? "Crear con IA" : "Editar con IA"}
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
