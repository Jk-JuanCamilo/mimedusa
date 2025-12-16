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
  // Documentos Comerciales
  { value: "contract", label: "📜 Contrato General", description: "Contratos de trabajo, alquiler, servicios" },
  { value: "invoice", label: "🧾 Factura", description: "Facturas comerciales con desglose" },
  { value: "quote", label: "💰 Cotización", description: "Presupuestos y cotizaciones" },
  { value: "receipt", label: "🧾 Recibo", description: "Recibos de pago y comprobantes" },
  { value: "proposal", label: "💼 Propuesta Comercial", description: "Propuestas de negocio persuasivas" },
  { value: "purchase-order", label: "📦 Orden de Compra", description: "Pedidos a proveedores" },
  { value: "delivery-note", label: "🚚 Remisión", description: "Nota de entrega de mercancía" },
  { value: "credit-note", label: "💳 Nota Crédito", description: "Devoluciones y ajustes" },
  
  // Contratos Específicos
  { value: "rental-contract", label: "🏠 Contrato Arriendo", description: "Arrendamiento de vivienda o local" },
  { value: "work-contract", label: "👔 Contrato Laboral", description: "Contrato de trabajo completo" },
  { value: "service-contract", label: "🔧 Contrato Servicios", description: "Prestación de servicios profesionales" },
  { value: "sales-contract", label: "🤝 Contrato Compraventa", description: "Compra y venta de bienes" },
  { value: "loan-contract", label: "💵 Contrato Préstamo", description: "Préstamo de dinero entre partes" },
  { value: "partnership-agreement", label: "🤝 Acuerdo de Sociedad", description: "Constitución de sociedades" },
  { value: "franchise-agreement", label: "🏪 Contrato Franquicia", description: "Acuerdo de franquicia comercial" },
  
  // Documentos Laborales
  { value: "cv", label: "📋 Currículum Vitae", description: "CV profesional estructurado" },
  { value: "letter", label: "✉️ Carta Formal", description: "Cartas de presentación, renuncia, etc." },
  { value: "recommendation-letter", label: "⭐ Carta Recomendación", description: "Recomendación laboral o académica" },
  { value: "resignation-letter", label: "👋 Carta de Renuncia", description: "Renuncia profesional y cordial" },
  { value: "termination-letter", label: "📍 Carta Terminación", description: "Terminación de contrato laboral" },
  { value: "work-certificate", label: "📄 Constancia Laboral", description: "Certificación de trabajo" },
  { value: "salary-certificate", label: "💰 Certificado Salarial", description: "Certificación de ingresos" },
  { value: "experience-certificate", label: "🎯 Certificado Experiencia", description: "Constancia de experiencia laboral" },
  
  // Documentos Legales
  { value: "nda", label: "🔒 NDA", description: "Acuerdo de confidencialidad" },
  { value: "power-of-attorney", label: "⚖️ Poder Notarial", description: "Poder legal con facultades" },
  { value: "affidavit", label: "📜 Declaración Jurada", description: "Declaración bajo juramento" },
  { value: "promissory-note", label: "📝 Pagaré", description: "Documento de deuda" },
  { value: "lease-termination", label: "🏠 Terminación Arriendo", description: "Fin de contrato de arriendo" },
  { value: "waiver", label: "✋ Exoneración", description: "Liberación de responsabilidad" },
  
  // Documentos Judiciales
  { value: "tutela", label: "⚖️ Tutela", description: "Acción de tutela para protección de derechos" },
  { value: "lawsuit", label: "⚖️ Demanda", description: "Demandas civiles y laborales" },
  { value: "petition", label: "📄 Derecho de Petición", description: "Solicitudes formales a entidades" },
  { value: "pqr", label: "📨 PQR", description: "Peticiones, quejas y reclamos" },
  { value: "complaint", label: "📢 Queja Formal", description: "Quejas formales ante autoridades" },
  { value: "appeal", label: "🔄 Recurso de Apelación", description: "Apelación de decisiones" },
  { value: "habeas-corpus", label: "🔓 Habeas Corpus", description: "Protección de libertad personal" },
  { value: "custody-request", label: "👨‍👧 Solicitud Custodia", description: "Petición de custodia de menores" },
  
  // Documentos Corporativos
  { value: "report", label: "📊 Reporte/Informe", description: "Informes profesionales" },
  { value: "memo", label: "📝 Memorando", description: "Comunicaciones internas empresariales" },
  { value: "minutes", label: "📋 Acta de Reunión", description: "Actas de reunión y asambleas" },
  { value: "board-resolution", label: "🏛️ Resolución Junta", description: "Decisiones de junta directiva" },
  { value: "shareholders-meeting", label: "👥 Acta Asamblea", description: "Acta de asamblea de accionistas" },
  { value: "company-policy", label: "📑 Política Empresarial", description: "Políticas y procedimientos internos" },
  
  // Documentos Académicos
  { value: "thesis-cover", label: "🎓 Portada Tesis", description: "Portada formal para tesis" },
  { value: "academic-certificate", label: "📜 Certificado Académico", description: "Constancia de estudios" },
  { value: "enrollment-letter", label: "🏫 Carta Matrícula", description: "Constancia de matrícula" },
  { value: "academic-recommendation", label: "📚 Recomendación Académica", description: "Carta de recomendación académica" },
  { value: "research-proposal", label: "🔬 Propuesta Investigación", description: "Propuesta de proyecto de investigación" },
  
  // Certificados y Reconocimientos
  { value: "certificate", label: "🏆 Certificado", description: "Diplomas y reconocimientos" },
  { value: "achievement-award", label: "🥇 Reconocimiento", description: "Premio o reconocimiento especial" },
  { value: "participation-certificate", label: "📜 Certificado Participación", description: "Constancia de asistencia o participación" },
  { value: "training-certificate", label: "🎯 Certificado Capacitación", description: "Constancia de curso o capacitación" },
  
  // Documentos Personales
  { value: "authorization", label: "✅ Autorización", description: "Autorización para trámites" },
  { value: "consent-form", label: "📝 Consentimiento", description: "Formulario de consentimiento informado" },
  { value: "medical-excuse", label: "🏥 Excusa Médica", description: "Justificación por motivos de salud" },
  { value: "travel-authorization", label: "✈️ Permiso de Viaje", description: "Autorización de viaje para menores" },
  { value: "will-testament", label: "📜 Testamento", description: "Última voluntad y testamento" },
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
        body: { description, customTitle: customTitle.trim() || undefined }
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
                Describe qué documento necesitas
              </label>
              <SpeechTextarea
                placeholder="Describe el documento que necesitas. Ej: 'Un contrato de arrendamiento para un apartamento en Bogotá', 'Una factura para servicios de diseño web', 'Un CV para ingeniero de software'..."
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
              disabled={isGenerating || !description.trim()}
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
              Medussa IA detectará automáticamente el tipo de documento
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
