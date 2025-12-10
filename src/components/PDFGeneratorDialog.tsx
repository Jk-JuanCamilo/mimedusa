import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePDF, downloadPDF } from "@/utils/pdfGenerator";

interface PDFGeneratorDialogProps {
  disabled?: boolean;
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

export function PDFGeneratorDialog({ disabled }: PDFGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templateType, setTemplateType] = useState("");
  const [description, setDescription] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

      // Download the PDF
      const filename = `${(customTitle || title || templateType).replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      downloadPDF(pdfBytes, filename);

      toast.success("¡PDF generado y descargado!");
      setIsOpen(false);
      setDescription("");
      setCustomTitle("");
      setTemplateType("");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generar Documento PDF
          </DialogTitle>
        </DialogHeader>

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
            <Textarea
              placeholder={
                templateType === "contract" ? "Ej: Un contrato de arrendamiento para un apartamento en Bogotá, por 12 meses, con precio de $1,500,000 mensuales..."
                : templateType === "invoice" ? "Ej: Factura para empresa XYZ, por servicios de diseño web, valor $2,000,000..."
                : templateType === "cv" ? "Ej: CV para ingeniero de software con 5 años de experiencia en React, Python y AWS..."
                : "Describe los detalles específicos que necesitas incluir..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background/50 border-border min-h-[120px]"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/5000 caracteres
            </p>
          </div>

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
                <Download className="w-4 h-4 mr-2" />
                Generar y Descargar PDF
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            El documento se generará con contenido profesional basado en tu descripción
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
