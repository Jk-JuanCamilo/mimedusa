import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { SpeechTextarea } from "@/components/ui/speech-textarea";
import { FileText, Download, Loader2, ArrowLeft, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType } from "docx";

interface DOCXGeneratorDialogProps {
  disabled?: boolean;
  onSaveToHistory?: (userMessage: string, assistantMessage: string) => Promise<void>;
  isAuthenticated?: boolean;
}

interface PreviewData {
  docxBlob: Blob;
  content: string;
  title: string;
  filename: string;
}

type BorderStyleOption = "double" | "single" | "thick" | "triple" | "dotted" | "dashed" | "wave" | "shadow" | "inset" | "outset" | "none";

const borderOptions: { value: BorderStyleOption; label: string; description: string }[] = [
  { value: "double", label: "Doble", description: "Borde doble elegante" },
  { value: "single", label: "Simple", description: "Línea simple clásica" },
  { value: "thick", label: "Grueso", description: "Borde grueso y prominente" },
  { value: "triple", label: "Triple", description: "Tres líneas paralelas" },
  { value: "dotted", label: "Punteado", description: "Línea de puntos" },
  { value: "dashed", label: "Discontinuo", description: "Línea discontinua" },
  { value: "wave", label: "Ondulado", description: "Borde con ondas" },
  { value: "shadow", label: "Sombra", description: "Efecto de sombra 3D" },
  { value: "inset", label: "Hundido", description: "Efecto hacia adentro" },
  { value: "outset", label: "Relieve", description: "Efecto hacia afuera" },
  { value: "none", label: "Sin Borde", description: "Documento limpio sin bordes" },
];

function BorderPreview({ borderStyle }: { borderStyle: BorderStyleOption }) {
  const option = borderOptions.find(o => o.value === borderStyle);
  if (!option) return null;

  const getBorderCSS = () => {
    switch (borderStyle) {
      case "double":
        return "border-[3px] border-double border-black";
      case "single":
        return "border-2 border-solid border-black";
      case "thick":
        return "border-4 border-solid border-black";
      case "triple":
        return "border-[4px] border-double border-black outline outline-1 outline-black outline-offset-1";
      case "dotted":
        return "border-2 border-dotted border-black";
      case "dashed":
        return "border-2 border-dashed border-black";
      case "wave":
        return "border-2 border-solid border-black [border-style:wavy]";
      case "shadow":
        return "border-2 border-solid border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]";
      case "inset":
        return "border-4 border-black [border-style:inset]";
      case "outset":
        return "border-4 border-black [border-style:outset]";
      case "none":
        return "border border-dashed border-gray-300";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground text-center block">Vista previa del borde</Label>
      <div className="flex justify-center">
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 shadow-inner">
          {/* Paper sheet */}
          <div 
            className={`w-24 h-32 bg-white rounded-sm shadow-lg ${getBorderCSS()} flex flex-col items-center justify-center transition-all duration-300`}
            style={{ aspectRatio: '210/297' }}
          >
            {/* Document content simulation */}
            <div className="w-full px-2 space-y-1">
              <div className="h-1.5 bg-gray-300 rounded w-3/4 mx-auto" />
              <div className="h-1 bg-gray-200 rounded w-full" />
              <div className="h-1 bg-gray-200 rounded w-5/6" />
              <div className="h-1 bg-gray-200 rounded w-full" />
              <div className="h-1 bg-gray-200 rounded w-4/5" />
            </div>
          </div>
          {/* Style label */}
          <p className="text-[10px] font-medium text-center mt-2 text-foreground">{option.label}</p>
        </div>
      </div>
    </div>
  );
}

const templateOptions = [
  // Cartas Empresariales
  { value: "business-letter", label: "Carta Empresarial", description: "Carta formal con membrete profesional" },
  { value: "cover-letter", label: "Carta de Presentación", description: "Presentación para empleo" },
  { value: "introduction-letter", label: "Carta de Introducción", description: "Presentación de empresa o servicio" },
  { value: "invitation-letter", label: "Carta de Invitación", description: "Invitación formal a eventos" },
  { value: "thank-you-letter", label: "Carta de Agradecimiento", description: "Agradecimiento profesional" },
  { value: "apology-letter", label: "Carta de Disculpa", description: "Disculpa profesional" },
  { value: "follow-up-letter", label: "Carta de Seguimiento", description: "Seguimiento a reuniones o propuestas" },
  { value: "confirmation-letter", label: "Carta de Confirmación", description: "Confirmación de acuerdos o citas" },
  
  // Documentos Laborales
  { value: "resume", label: "Hoja de Vida", description: "CV profesional y moderno" },
  { value: "functional-resume", label: "CV Funcional", description: "CV enfocado en habilidades" },
  { value: "academic-cv", label: "CV Académico", description: "CV para entorno universitario" },
  { value: "recommendation-letter", label: "Carta de Recomendación", description: "Recomendación laboral o académica" },
  { value: "reference-letter", label: "Carta de Referencia", description: "Referencia de buena conducta" },
  { value: "work-certificate", label: "Constancia Laboral", description: "Certificación de trabajo" },
  { value: "salary-certificate", label: "Certificado de Ingresos", description: "Constancia de salario" },
  { value: "experience-certificate", label: "Certificado de Experiencia", description: "Constancia de experiencia laboral" },
  { value: "resignation-letter", label: "Carta de Renuncia", description: "Renuncia profesional" },
  { value: "termination-letter", label: "Carta de Terminación", description: "Terminación de contrato" },
  { value: "promotion-letter", label: "Carta de Promoción", description: "Notificación de ascenso" },
  { value: "warning-letter", label: "Carta de Amonestación", description: "Llamado de atención formal" },
  { value: "job-offer", label: "Oferta de Empleo", description: "Carta de oferta laboral" },
  
  // Contratos
  { value: "contract", label: "Contrato General", description: "Contrato legal con cláusulas" },
  { value: "rental-contract", label: "Contrato de Arrendamiento", description: "Arriendo de vivienda o local" },
  { value: "work-contract", label: "Contrato de Trabajo", description: "Contrato laboral completo" },
  { value: "service-contract", label: "Contrato de Servicios", description: "Prestación de servicios profesionales" },
  { value: "sales-contract", label: "Contrato de Compraventa", description: "Compra y venta de bienes" },
  { value: "loan-contract", label: "Contrato de Préstamo", description: "Préstamo de dinero" },
  { value: "partnership-contract", label: "Contrato de Sociedad", description: "Constitución de sociedad" },
  { value: "franchise-contract", label: "Contrato de Franquicia", description: "Acuerdo de franquicia" },
  { value: "maintenance-contract", label: "Contrato de Mantenimiento", description: "Servicios de mantenimiento" },
  { value: "consulting-contract", label: "Contrato de Consultoría", description: "Servicios de consultoría" },
  { value: "freelance-contract", label: "Contrato Freelance", description: "Trabajo independiente" },
  { value: "internship-contract", label: "Contrato de Pasantía", description: "Prácticas profesionales" },
  { value: "confidentiality-contract", label: "Contrato de Confidencialidad", description: "NDA completo" },
  
  // Documentos Comerciales
  { value: "invoice", label: "Factura", description: "Factura comercial detallada" },
  { value: "quote", label: "Cotización", description: "Cotización de productos/servicios" },
  { value: "receipt", label: "Recibo de Pago", description: "Comprobante de pago" },
  { value: "proposal", label: "Propuesta Comercial", description: "Propuesta de negocios persuasiva" },
  { value: "purchase-order", label: "Orden de Compra", description: "Pedido a proveedores" },
  { value: "delivery-receipt", label: "Acta de Entrega", description: "Recepción de productos/servicios" },
  { value: "credit-note", label: "Nota de Crédito", description: "Ajuste de facturación" },
  { value: "sponsorship-proposal", label: "Propuesta de Patrocinio", description: "Solicitud de patrocinio" },
  
  // Informes y Actas
  { value: "report", label: "Informe Ejecutivo", description: "Informe con análisis" },
  { value: "technical-report", label: "Informe Técnico", description: "Reporte técnico detallado" },
  { value: "audit-report", label: "Informe de Auditoría", description: "Resultados de auditoría" },
  { value: "progress-report", label: "Informe de Avance", description: "Progreso de proyecto" },
  { value: "incident-report", label: "Informe de Incidente", description: "Reporte de incidentes" },
  { value: "meeting-minutes", label: "Acta de Reunión", description: "Acta formal de reuniones" },
  { value: "board-minutes", label: "Acta de Junta Directiva", description: "Acta de junta directiva" },
  { value: "shareholders-minutes", label: "Acta de Asamblea", description: "Acta de asamblea de socios" },
  
  // Comunicaciones Internas
  { value: "memo", label: "Memorando", description: "Comunicación interna" },
  { value: "circular", label: "Circular", description: "Comunicado general" },
  { value: "notice", label: "Aviso", description: "Notificación interna" },
  { value: "policy-document", label: "Política Empresarial", description: "Documento de políticas" },
  { value: "procedure-document", label: "Procedimiento", description: "Manual de procedimientos" },
  { value: "manual", label: "Manual", description: "Manual de usuario o empleado" },
  
  // Documentos Legales
  { value: "agreement", label: "Acuerdo de Confidencialidad", description: "NDA profesional" },
  { value: "power-of-attorney", label: "Poder Notarial", description: "Poder legal con facultades" },
  { value: "authorization", label: "Autorización", description: "Autorización para trámites" },
  { value: "promissory-note", label: "Pagaré", description: "Documento de deuda" },
  { value: "affidavit", label: "Declaración Jurada", description: "Declaración bajo juramento" },
  { value: "waiver", label: "Exoneración", description: "Liberación de responsabilidad" },
  { value: "consent-form", label: "Consentimiento Informado", description: "Autorización con información" },
  { value: "will-testament", label: "Testamento", description: "Última voluntad" },
  
  // Peticiones y Quejas
  { value: "petition", label: "Derecho de Petición", description: "Petición legal formal" },
  { value: "complaint", label: "Queja o Reclamo", description: "Queja formal ante entidad" },
  { value: "appeal", label: "Recurso de Apelación", description: "Apelación de decisiones" },
  { value: "tutela", label: "Acción de Tutela", description: "Protección de derechos fundamentales" },
  { value: "pqr", label: "PQR", description: "Petición, Queja o Reclamo" },
  
  // Certificados
  { value: "certificate", label: "Certificado General", description: "Certificado formal y elegante" },
  { value: "achievement-certificate", label: "Certificado de Logro", description: "Reconocimiento de logros" },
  { value: "completion-certificate", label: "Certificado de Finalización", description: "Curso o programa completado" },
  { value: "participation-certificate", label: "Certificado de Participación", description: "Asistencia a eventos" },
  { value: "training-certificate", label: "Certificado de Capacitación", description: "Formación completada" },
  { value: "diploma", label: "Diploma", description: "Diploma académico" },
  
  // Documentos Académicos
  { value: "thesis-cover", label: "Portada de Tesis", description: "Portada formal para tesis" },
  { value: "abstract", label: "Resumen Ejecutivo", description: "Abstract o resumen" },
  { value: "research-proposal", label: "Propuesta de Investigación", description: "Proyecto de investigación" },
  { value: "academic-letter", label: "Carta Académica", description: "Comunicación universitaria" },
  { value: "recommendation-academic", label: "Recomendación Académica", description: "Para estudios o becas" },
  
  // Documentos Personales
  { value: "travel-authorization", label: "Permiso de Viaje", description: "Autorización de viaje para menores" },
  { value: "medical-excuse", label: "Excusa Médica", description: "Justificación por salud" },
  { value: "personal-reference", label: "Referencia Personal", description: "Carta de recomendación personal" },
  { value: "character-reference", label: "Referencia de Carácter", description: "Testimonio de conducta" },
];

export function DOCXGeneratorDialog({ disabled, onSaveToHistory, isAuthenticated }: DOCXGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateType, setTemplateType] = useState("");
  const [description, setDescription] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [borderStyle, setBorderStyle] = useState<BorderStyleOption>("double");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveToHistory, setSaveToHistory] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const { toast } = useToast();

  const handleClose = () => {
    setOpen(false);
    setPreview(null);
    setIsEditing(false);
    setEditedContent("");
  };

  const getBorderConfig = (style: BorderStyleOption) => {
    const configs: Record<BorderStyleOption, { style: typeof BorderStyle[keyof typeof BorderStyle]; size: number; color: string; space: number } | null> = {
      "double": {
        style: BorderStyle.DOUBLE,
        size: 12,
        color: "000000",
        space: 24,
      },
      "single": {
        style: BorderStyle.SINGLE,
        size: 8,
        color: "000000",
        space: 24,
      },
      "thick": {
        style: BorderStyle.THICK,
        size: 18,
        color: "000000",
        space: 24,
      },
      "triple": {
        style: BorderStyle.TRIPLE,
        size: 12,
        color: "000000",
        space: 24,
      },
      "dotted": {
        style: BorderStyle.DOTTED,
        size: 8,
        color: "000000",
        space: 24,
      },
      "dashed": {
        style: BorderStyle.DASHED,
        size: 8,
        color: "000000",
        space: 24,
      },
      "wave": {
        style: BorderStyle.WAVE,
        size: 8,
        color: "000000",
        space: 24,
      },
      "shadow": {
        style: BorderStyle.THREE_D_ENGRAVE,
        size: 12,
        color: "000000",
        space: 24,
      },
      "inset": {
        style: BorderStyle.INSET,
        size: 12,
        color: "000000",
        space: 24,
      },
      "outset": {
        style: BorderStyle.OUTSET,
        size: 12,
        color: "000000",
        space: 24,
      },
      "none": null,
    };
    return configs[style];
  };

  const createDocxFromContent = async (content: string, title: string, selectedBorder: BorderStyleOption): Promise<Blob> => {
    const lines = content.split('\n');
    const children: Paragraph[] = [];

    // Add title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
            color: "000000",
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Add separator line
    children.push(
      new Paragraph({
        border: {
          bottom: {
            color: "000000",
            space: 1,
            size: 12,
            style: BorderStyle.SINGLE,
          },
        },
        spacing: { after: 300 },
      })
    );

    // Process content
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        children.push(new Paragraph({ spacing: { after: 100 } }));
        continue;
      }

      if (trimmedLine.startsWith('## ')) {
        // Section header
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace('## ', ''),
                bold: true,
                size: 26,
                color: "000000",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            border: {
              bottom: {
                color: "000000",
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE,
              },
            },
          })
        );
      } else if (trimmedLine.startsWith('### ')) {
        // Subsection header
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace('### ', ''),
                bold: true,
                size: 24,
                color: "000000",
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        // Bullet point
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "• " + trimmedLine.replace(/^[-•]\s*/, ''),
                size: 22,
              }),
            ],
            indent: { left: 720 },
            spacing: { after: 80 },
          })
        );
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold text
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/\*\*/g, ''),
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      } else {
        // Regular paragraph
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/\*\*/g, ''),
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    }

    // Add footer
    children.push(
      new Paragraph({
        spacing: { before: 600 },
      })
    );
    children.push(
      new Paragraph({
        border: {
          top: {
            color: "000000",
            space: 1,
            size: 6,
            style: BorderStyle.SINGLE,
          },
        },
        children: [
          new TextRun({
            text: `Documento generado por Medussa IA - ${new Date().toLocaleDateString('es-ES')}`,
            size: 18,
            italics: true,
            color: "000000",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
      })
    );

    const borderConfig = getBorderConfig(selectedBorder);
    
    const doc = new Document({
      sections: [
        {
          properties: {
            page: borderConfig ? {
              borders: {
                pageBorderBottom: borderConfig,
                pageBorderLeft: borderConfig,
                pageBorderRight: borderConfig,
                pageBorderTop: borderConfig,
              },
            } : {},
          },
          children,
        },
      ],
    });

    return await Packer.toBlob(doc);
  };

  const handleGenerate = async () => {
    if (!templateType || !description.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona una plantilla y describe tu documento.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-docx', {
        body: { templateType, description, customTitle }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const title = data.title || "Documento";
      const content = data.content;
      const docxBlob = await createDocxFromContent(content, title, borderStyle);
      const filename = `${title.replace(/\s+/g, '_')}_${Date.now()}.docx`;

      setPreview({ docxBlob, content, title, filename });
      setEditedContent(content);

      toast({
        title: "Documento generado",
        description: "Revisa el documento y descárgalo cuando estés listo.",
      });

    } catch (error) {
      console.error('Error generating DOCX:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el documento.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!preview) return;

    const url = URL.createObjectURL(preview.docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = preview.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (saveToHistory && onSaveToHistory && isAuthenticated) {
      await onSaveToHistory(
        `Generar documento Word: ${templateType} - ${description}`,
        `Documento "${preview.title}" generado y descargado exitosamente.`
      );
    }

    toast({
      title: "Descarga iniciada",
      description: "Tu documento Word se está descargando.",
    });
  };

  const handleBackToEdit = () => {
    setPreview(null);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleRegenerateDocx = async () => {
    if (!preview) return;

    try {
      const docxBlob = await createDocxFromContent(editedContent, preview.title, borderStyle);
      setPreview({ ...preview, docxBlob, content: editedContent });
      setIsEditing(false);

      toast({
        title: "Documento actualizado",
        description: "Los cambios han sido aplicados.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el documento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2 border-border/50 hover:bg-accent hover:text-accent-foreground"
        >
          <FileText className="w-4 h-4" />
          Generar Word
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-white to-purple-50 dark:from-background dark:via-background dark:to-purple-950/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {preview ? (isEditing ? "Editar Documento" : "Vista Previa") : "Generador de Documentos Word"}
          </DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción del Documento</Label>
              <SpeechTextarea
                value={description}
                onChange={setDescription}
                placeholder="Describe qué necesitas en tu documento. Ejemplo: Carta de renuncia para empresa de tecnología, con tono profesional y agradecimiento por los años trabajados..."
                className="min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título Personalizado (opcional)</Label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ej: Carta de Renuncia - Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label>Estilo de Borde</Label>
                <Select value={borderStyle} onValueChange={(v) => setBorderStyle(v as BorderStyleOption)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un borde" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {borderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vista previa centrada */}
            <BorderPreview borderStyle={borderStyle} />

            {isAuthenticated && onSaveToHistory && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="save-docx-history"
                  checked={saveToHistory}
                  onCheckedChange={(checked) => setSaveToHistory(checked as boolean)}
                />
                <Label htmlFor="save-docx-history" className="text-sm">
                  Guardar en historial de conversaciones
                </Label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Generar Documento"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleRegenerateDocx}>
                    Aplicar Cambios
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <h3 className="font-bold text-lg mb-4 text-center border-b pb-2">{preview.title}</h3>
                  <div className="whitespace-pre-wrap text-sm">
                    {preview.content.split('\n').map((line, index) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('## ')) {
                        return <h4 key={index} className="font-bold text-primary mt-4 mb-2">{trimmed.replace('## ', '')}</h4>;
                      }
                      if (trimmed.startsWith('### ')) {
                        return <h5 key={index} className="font-semibold mt-3 mb-1">{trimmed.replace('### ', '')}</h5>;
                      }
                      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                        return <p key={index} className="ml-4">• {trimmed.replace(/^[-•]\s*/, '')}</p>;
                      }
                      return <p key={index} className="my-1">{line}</p>;
                    })}
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <Button variant="outline" onClick={handleBackToEdit}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleStartEditing}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Word
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
