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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, Loader2, Download, Eye, ArrowLeft, X, Edit, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface XLSXGeneratorDialogProps {
  disabled?: boolean;
  onSaveToHistory?: (userMessage: string, assistantMessage: string) => Promise<void>;
  isAuthenticated?: boolean;
}

interface PreviewData {
  workbook: XLSX.WorkBook;
  content: string;
  title: string;
  filename: string;
  jsonData: Record<string, unknown[][]>;
}

const templateOptions = [
  { value: "data-analysis", label: "📊 Análisis de Datos", description: "Plantilla para análisis estadístico con fórmulas" },
  { value: "finance", label: "💰 Finanzas", description: "Control de gastos, ingresos y balance" },
  { value: "sales", label: "📈 Ventas", description: "Seguimiento de ventas y comisiones" },
  { value: "inventory", label: "📦 Inventario", description: "Control de stock y productos" },
  { value: "budget", label: "💵 Presupuesto", description: "Planificación y control presupuestario" },
  { value: "report", label: "📋 Informe", description: "Reportes con tablas y resúmenes" },
  { value: "project", label: "📅 Gestión de Proyecto", description: "Cronograma y seguimiento de tareas" },
  { value: "payroll", label: "👥 Nómina", description: "Cálculo de salarios y deducciones" },
  { value: "invoice-tracker", label: "🧾 Facturas", description: "Registro y seguimiento de facturas" },
  { value: "kpi", label: "🎯 KPIs", description: "Indicadores clave de rendimiento" },
  { value: "macros", label: "⚙️ Macros VBA", description: "Plantilla con macros automatizadas" },
  { value: "custom", label: "✨ Personalizado", description: "Crea tu propia estructura" },
];

export function XLSXGeneratorDialog({ disabled, onSaveToHistory, isAuthenticated }: XLSXGeneratorDialogProps) {
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

  const handleClose = () => {
    setPreview(null);
    setIsOpen(false);
    setIsEditing(false);
    setEditedContent("");
  };

  const parseContentToData = (content: string): unknown[][] => {
    // Parse markdown/text table format to array of arrays
    const lines = content.split('\n').filter(line => line.trim());
    const data: unknown[][] = [];
    
    for (const line of lines) {
      // Skip separator lines
      if (line.match(/^[-|]+$/)) continue;
      
      // Parse table rows
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          // Try to convert numeric values
          const parsedCells = cells.map(cell => {
            const num = parseFloat(cell.replace(/[,$%]/g, ''));
            return isNaN(num) ? cell : num;
          });
          data.push(parsedCells);
        }
      } else if (line.includes('\t')) {
        // Tab-separated values
        const cells = line.split('\t').map(cell => cell.trim());
        const parsedCells = cells.map(cell => {
          const num = parseFloat(cell.replace(/[,$%]/g, ''));
          return isNaN(num) ? cell : num;
        });
        data.push(parsedCells);
      } else if (line.includes(',')) {
        // CSV format
        const cells = line.split(',').map(cell => cell.trim());
        const parsedCells = cells.map(cell => {
          const num = parseFloat(cell.replace(/[,$%]/g, ''));
          return isNaN(num) ? cell : num;
        });
        data.push(parsedCells);
      }
    }
    
    return data.length > 0 ? data : [['Datos', 'Valor'], ['Ejemplo', 100]];
  };

  const createWorkbookFromContent = (content: string, title: string): XLSX.WorkBook => {
    const workbook = XLSX.utils.book_new();
    
    // Split content by sheet markers or create single sheet
    const sheetSections = content.split(/---\s*HOJA:\s*/i);
    
    if (sheetSections.length > 1) {
      // Multiple sheets
      sheetSections.forEach((section, index) => {
        if (index === 0 && !section.trim()) return;
        
        const lines = section.split('\n');
        const sheetName = lines[0]?.trim() || `Hoja${index}`;
        const sheetContent = lines.slice(1).join('\n');
        const data = parseContentToData(sheetContent);
        
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
      });
    } else {
      // Single sheet
      const data = parseContentToData(content);
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));
    }
    
    return workbook;
  };

  const handleGenerate = async () => {
    if (!templateType) {
      toast.error("Selecciona un tipo de plantilla");
      return;
    }
    if (!description.trim()) {
      toast.error("Describe qué necesitas en el archivo Excel");
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debes iniciar sesión para generar archivos Excel");
        setIsGenerating(false);
        return;
      }

      const response = await supabase.functions.invoke('generate-xlsx', {
        body: { templateType, description, customTitle: customTitle.trim() || undefined }
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al generar el documento");
      }

      const { content, title } = response.data;
      const finalTitle = customTitle || title || templateOptions.find(t => t.value === templateType)?.label || "Documento";
      
      // Create workbook from content
      const workbook = createWorkbookFromContent(content, finalTitle);
      
      // Get JSON representation for preview
      const jsonData: Record<string, unknown[][]> = {};
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        jsonData[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      });

      const filename = `${finalTitle.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '').replace(/\s+/g, '_')}_${Date.now()}.xlsx`;

      setPreview({
        workbook,
        content,
        title: finalTitle,
        filename,
        jsonData
      });

      toast.success("¡Vista previa lista!");

    } catch (error) {
      console.error("Error generating XLSX:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar el Excel");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!preview) return;

    // Write workbook to file
    XLSX.writeFile(preview.workbook, preview.filename);

    // Save to conversation history if enabled
    if (saveToHistory && onSaveToHistory && isAuthenticated) {
      const templateLabel = templateOptions.find(t => t.value === templateType)?.label || templateType;
      const userMessage = `📊 Generar Excel: ${templateLabel}\n\n${description}`;
      const assistantMessage = `✅ **Excel Generado y Descargado**\n\n**Tipo:** ${templateLabel}\n**Título:** ${preview.title}\n\n---\n\n${preview.content}`;
      await onSaveToHistory(userMessage, assistantMessage);
    }

    toast.success("¡Excel descargado!");
    handleClose();
    setDescription("");
    setCustomTitle("");
    setTemplateType("");
  };

  const handleBackToEdit = () => {
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

  const handleRegenerateXLSX = async () => {
    if (!preview || !editedContent.trim()) return;
    
    setIsRegenerating(true);
    try {
      const workbook = createWorkbookFromContent(editedContent, preview.title);
      
      const jsonData: Record<string, unknown[][]> = {};
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        jsonData[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      });

      setPreview({
        ...preview,
        workbook,
        content: editedContent,
        jsonData
      });

      setIsEditing(false);
      toast.success("¡Excel actualizado con tus cambios!");
    } catch (error) {
      console.error("Error regenerating XLSX:", error);
      toast.error("Error al regenerar el Excel");
    } finally {
      setIsRegenerating(false);
    }
  };

  const renderPreviewTable = () => {
    if (!preview?.jsonData) return null;

    return (
      <div className="space-y-4">
        {Object.entries(preview.jsonData).map(([sheetName, rows]) => (
          <div key={sheetName} className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Table className="w-4 h-4" />
              {sheetName}
            </h4>
            <div className="overflow-auto max-h-[300px] border border-border rounded-lg">
              <table className="w-full text-xs">
                <tbody>
                  {(rows as unknown[][]).slice(0, 50).map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx === 0 ? "bg-primary/20 font-medium" : rowIdx % 2 === 0 ? "bg-muted/30" : ""}>
                      {(row as unknown[]).map((cell, cellIdx) => (
                        <td key={cellIdx} className="border border-border/50 px-2 py-1 whitespace-nowrap">
                          {String(cell ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {(rows as unknown[][]).length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ... y {(rows as unknown[][]).length - 50} filas más
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
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
          <Table className="w-4 h-4" />
          <span className="text-xs">Generar Excel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={`bg-card border-border ${preview ? 'max-w-4xl h-[90vh]' : 'max-w-lg'}`}>
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {preview ? (
              <>
                <Eye className="w-5 h-5" />
                Vista Previa del Excel
              </>
            ) : (
              <>
                <Table className="w-5 h-5" />
                Generar Archivo Excel
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {preview ? (
          <div className="flex flex-col gap-4 h-full overflow-hidden">
            {/* Preview or Editor */}
            <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-muted">
              {isEditing ? (
                <ScrollArea className="h-full">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-full min-h-[400px] bg-background border-0 resize-none p-4 font-mono text-sm"
                    placeholder="Edita el contenido (formato tabla con | o comas)..."
                  />
                </ScrollArea>
              ) : (
                <ScrollArea className="h-full p-4">
                  {renderPreviewTable()}
                </ScrollArea>
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
                    Ver Tabla
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
                    onClick={handleRegenerateXLSX}
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
                      Descargar Excel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Tipo de plantilla</label>
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
              <label className="text-sm text-muted-foreground">Título del archivo (opcional)</label>
              <Input
                placeholder="Ej: Ventas Q4 2024"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="bg-background/50 border-border"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Describe qué datos necesitas
              </label>
              <Textarea
                placeholder={
                  templateType === "data-analysis" ? "Ej: Análisis de ventas mensuales con promedio, desviación estándar y tendencia..."
                  : templateType === "finance" ? "Ej: Control de gastos del hogar con categorías: alimentación, servicios, transporte..."
                  : templateType === "sales" ? "Ej: Seguimiento de ventas por vendedor con metas y comisiones del 5%..."
                  : templateType === "macros" ? "Ej: Macro para formatear automáticamente tablas y calcular totales..."
                  : "Describe los datos, columnas y cálculos que necesitas..."
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

            {isAuthenticated && onSaveToHistory && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="save-history-xlsx" 
                  checked={saveToHistory}
                  onCheckedChange={(checked) => setSaveToHistory(checked === true)}
                />
                <label 
                  htmlFor="save-history-xlsx" 
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
                  Generando Excel...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Generar y Ver Vista Previa
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              El archivo se generará con estructura profesional basada en tu descripción
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}