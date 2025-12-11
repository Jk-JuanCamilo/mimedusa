import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SpeechTextarea } from "@/components/ui/speech-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Download, Eye, ArrowLeft, X, Edit, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePDF, downloadPDF } from "@/utils/pdfGenerator";

interface PDFGeneratorDialogProps {
  disabled?: boolean;
  onSaveToHistory?: (userMessage: string, assistantMessage: string) => Promise<void>;
  isAuthenticated?: boolean;
}

interface PreviewData {
  pdfBytes: Uint8Array;
  pdfUrl: string;
  content: string;
  title: string;
  filename: string;
}

const templateOptions = [
  { value: "contract", label: "📜 Contrato", description: "Contratos de trabajo, alquiler, servicios" },
  { value: "invoice", label: "🧾 Factura", description: "Facturas comerciales con desglose" },
  { value: "cv", label: "📋 Currículum Vitae", description: "CV profesional estructurado" },
  { value: "letter", label: "✉️ Carta Formal", description: "Cartas de presentación, renuncia, etc." },
  { value: "quote", label: "💰 Cotización", description: "Presupuestos y cotizaciones" },
  { value: "certificate", label: "🏆 Certificado", description: "Diplomas y reconocimientos" },
  { value: "nda", label: "🔒 NDA", description: "Acuerdo de confidencialidad" },
  { value: "report", label: "📊 Reporte/Informe", description: "Informes profesionales" },
  { value: "receipt", label: "🧾 Recibo", description: "Recibos de pago y comprobantes" },
  { value: "memo", label: "📝 Memorando", description: "Comunicaciones internas empresariales" },
  { value: "minutes", label: "📋 Acta", description: "Actas de reunión y asambleas" },
  { value: "tutela", label: "⚖️ Tutela", description: "Acción de tutela para protección de derechos" },
  { value: "lawsuit", label: "⚖️ Demanda", description: "Demandas civiles y laborales" },
  { value: "petition", label: "📄 Derecho de Petición", description: "Solicitudes formales a entidades" },
  { value: "pqr", label: "📨 PQR", description: "Peticiones, quejas y reclamos" },
  { value: "complaint", label: "📢 Queja", description: "Quejas formales ante autoridades" },
];

export function PDFGeneratorDialog({ disabled, onSaveToHistory, isAuthenticated }: PDFGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templateType, setTemplateType] = useState("");
  const [description, setDescription] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Clean up blob URL when preview changes or dialog closes
  useEffect(() => {
    return () => {
      if (preview?.pdfUrl) {
        URL.revokeObjectURL(preview.pdfUrl);
      }
    };
  }, [preview]);

  const handleClose = () => {
    if (preview?.pdfUrl) {
      URL.revokeObjectURL(preview.pdfUrl);
    }
    setPreview(null);
    setIsOpen(false);
  };

  const handleGenerate = async () => {
    if (!templateType) {
      toast.error("Selecciona un tipo de documento");
      return;
    }
    if (!description.trim()) {
      toast.error("Describe qué necesitas en el documento");
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debes iniciar sesión para generar PDFs");
        setIsGenerating(false);
        return;
      }

      const response = await supabase.functions.invoke('generate-pdf', {
        body: { templateType, description, customTitle: customTitle.trim() || undefined }
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al generar el documento");
      }

      const { content, title } = response.data;

      // Generate PDF on client side
      const pdfBytes = await generatePDF({
        title: title || customTitle || templateOptions.find(t => t.value === templateType)?.label || "Documento",
        content,
        templateType
      });

      // Create blob URL for preview
      const arrayBuffer = pdfBytes.slice().buffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      const filename = `${(customTitle || title || templateType).replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      setPreview({
        pdfBytes,
        pdfUrl,
        content,
        title: title || customTitle || templateOptions.find(t => t.value === templateType)?.label || "Documento",
        filename
      });

      toast.success("¡Vista previa lista!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!preview) return;

    downloadPDF(preview.pdfBytes, preview.filename);

    // Save to conversation history if enabled
    if (saveToHistory && onSaveToHistory && isAuthenticated) {
      const templateLabel = templateOptions.find(t => t.value === templateType)?.label || templateType;
      const userMessage = `📄 Generar PDF: ${templateLabel}\n\n${description}`;
      const assistantMessage = `✅ **PDF Generado y Descargado**\n\n**Tipo:** ${templateLabel}\n**Título:** ${preview.title}\n\n---\n\n${preview.content}`;
      await onSaveToHistory(userMessage, assistantMessage);
    }

    toast.success("¡PDF descargado!");
    handleClose();
    setDescription("");
    setCustomTitle("");
    setTemplateType("");
  };

  const handleBackToEdit = () => {
    if (preview?.pdfUrl) {
      URL.revokeObjectURL(preview.pdfUrl);
    }
    setPreview(null);
    setIsEditing(false);
    setEditedContent("");
  };

  const handleStartEditing = () => {
    if (preview) {
      setEditedContent(preview.content);
      setIsEditing(true);
    }
  };

  const handleRegeneratePDF = async () => {
    if (!preview || !editedContent.trim()) return;
    
    setIsRegenerating(true);
    try {
      // Regenerate PDF with edited content
      const pdfBytes = await generatePDF({
        title: preview.title,
        content: editedContent,
        templateType
      });

      // Clean up old blob URL
      URL.revokeObjectURL(preview.pdfUrl);

      // Create new blob URL
      const arrayBuffer = pdfBytes.slice().buffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);

      setPreview({
        ...preview,
        pdfBytes,
        pdfUrl,
        content: editedContent
      });

      setIsEditing(false);
      toast.success("¡PDF actualizado con tus cambios!");
    } catch (error) {
      console.error("Error regenerating PDF:", error);
      toast.error("Error al regenerar el PDF");
    } finally {
      setIsRegenerating(false);
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
          <FileText className="w-4 h-4" />
          <span className="text-xs">Generar PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={`bg-card border-border ${preview ? 'max-w-4xl h-[90vh]' : 'max-w-lg'}`}>
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {preview ? (
              <>
                <Eye className="w-5 h-5" />
                Vista Previa del PDF
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generar Documento PDF
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {preview ? (
          <div className="flex flex-col gap-4 h-full">
            {/* PDF Preview or Editor */}
            <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-muted">
              {isEditing ? (
                <ScrollArea className="h-full">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-full min-h-[400px] bg-background border-0 resize-none p-4 font-mono text-sm"
                    placeholder="Edita el contenido del documento..."
                  />
                </ScrollArea>
              ) : (
                <iframe
                  src={preview.pdfUrl}
                  className="w-full h-full min-h-[400px]"
                  title="Vista previa del PDF"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-between flex-wrap">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToEdit}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
                {isEditing ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver PDF
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleStartEditing}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar contenido
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <Button
                    onClick={handleRegeneratePDF}
                    disabled={isRegenerating || !editedContent.trim()}
                    className="flex items-center gap-2"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Regenerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Aplicar cambios
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleDownload}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Tipo de documento</label>
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger className="bg-background/50 border-border">
                  <SelectValue placeholder="Selecciona una plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Título personalizado (opcional)</label>
              <Input
                placeholder="Ej: Contrato de Arrendamiento 2024"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="bg-background/50 border-border"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Describe qué necesitas en el documento
              </label>
              <SpeechTextarea
                placeholder={
                  templateType === "contract" ? "Ej: Un contrato de arrendamiento para un apartamento en Bogotá, por 12 meses, con precio de $1,500,000 mensuales..."
                  : templateType === "invoice" ? "Ej: Factura para empresa XYZ, por servicios de diseño web, valor $2,000,000..."
                  : templateType === "cv" ? "Ej: CV para ingeniero de software con 5 años de experiencia en React, Python y AWS..."
                  : "Describe los detalles específicos que necesitas incluir..."
                }
                value={description}
                onChange={setDescription}
                className="bg-background/50 border-border min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/5000 caracteres
              </p>
            </div>

            {isAuthenticated && onSaveToHistory && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="save-history" 
                  checked={saveToHistory}
                  onCheckedChange={(checked) => setSaveToHistory(checked === true)}
                />
                <label 
                  htmlFor="save-history" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Guardar en historial de conversaciones
                </label>
              </div>
            )}

            <Button
              onClick={handleGenerate} 
              disabled={isGenerating || !templateType || !description.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando documento...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Generar y Ver Vista Previa
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              El documento se generará con contenido profesional basado en tu descripción
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
