import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const templateOptions = [
  { value: "business-letter", label: "Carta Empresarial", description: "Carta formal con membrete profesional" },
  { value: "resume", label: "Hoja de Vida", description: "CV profesional y moderno" },
  { value: "contract", label: "Contrato", description: "Contrato legal con cláusulas" },
  { value: "invoice", label: "Factura", description: "Factura comercial detallada" },
  { value: "proposal", label: "Propuesta Comercial", description: "Propuesta de negocios persuasiva" },
  { value: "report", label: "Informe Ejecutivo", description: "Informe con análisis y recomendaciones" },
  { value: "meeting-minutes", label: "Acta de Reunión", description: "Acta formal de reuniones" },
  { value: "memo", label: "Memorando", description: "Comunicación interna corporativa" },
  { value: "certificate", label: "Certificado", description: "Certificado formal y elegante" },
  { value: "agreement", label: "Acuerdo de Confidencialidad", description: "NDA profesional" },
  { value: "power-of-attorney", label: "Poder Notarial", description: "Poder legal con facultades" },
  { value: "petition", label: "Derecho de Petición", description: "Petición legal formal" },
];

export function DOCXGeneratorDialog({ disabled, onSaveToHistory, isAuthenticated }: DOCXGeneratorDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateType, setTemplateType] = useState("");
  const [description, setDescription] = useState("");
  const [customTitle, setCustomTitle] = useState("");
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

  const createDocxFromContent = async (content: string, title: string): Promise<Blob> => {
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
            color: "2E3B4E",
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
            color: "6B46C1",
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
                color: "6B46C1",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            border: {
              bottom: {
                color: "E9D5FF",
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
                color: "4A5568",
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
            color: "E9D5FF",
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
            color: "718096",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              borders: {
                pageBorderBottom: {
                  style: BorderStyle.DOUBLE,
                  size: 12,
                  color: "6B46C1",
                  space: 24,
                },
                pageBorderLeft: {
                  style: BorderStyle.DOUBLE,
                  size: 12,
                  color: "6B46C1",
                  space: 24,
                },
                pageBorderRight: {
                  style: BorderStyle.DOUBLE,
                  size: 12,
                  color: "6B46C1",
                  space: 24,
                },
                pageBorderTop: {
                  style: BorderStyle.DOUBLE,
                  size: 12,
                  color: "6B46C1",
                  space: 24,
                },
              },
            },
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
      const docxBlob = await createDocxFromContent(content, title);
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
      const docxBlob = await createDocxFromContent(editedContent, preview.title);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe qué necesitas en tu documento. Ejemplo: Carta de renuncia para empresa de tecnología, con tono profesional y agradecimiento por los años trabajados..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Título Personalizado (opcional)</Label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ej: Carta de Renuncia - Juan Pérez"
              />
            </div>

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
