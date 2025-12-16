import { useState, useRef } from "react";
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
import { Table, Loader2, Download, Eye, ArrowLeft, X, Edit, RefreshCw, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import XLSX from "xlsx-js-style";
import { getThemeById, applyThemeToSheet, getRandomTheme } from "@/utils/excelThemes";

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
  themeId: string;
}

const templateOptions = [
  // Análisis y Datos
  { value: "data-analysis", label: "📊 Análisis de Datos", description: "Análisis estadístico con fórmulas avanzadas" },
  { value: "dashboard", label: "📈 Dashboard", description: "Panel de control visual con métricas" },
  { value: "pivot-data", label: "🔄 Datos para Pivot", description: "Datos estructurados para tablas dinámicas" },
  { value: "survey-results", label: "📝 Resultados Encuesta", description: "Análisis de encuestas y formularios" },
  { value: "statistical-report", label: "📉 Informe Estadístico", description: "Reportes con análisis estadísticos" },
  
  // Finanzas y Contabilidad
  { value: "finance", label: "💰 Finanzas", description: "Control de gastos, ingresos y balance" },
  { value: "budget", label: "💵 Presupuesto", description: "Planificación y control presupuestario" },
  { value: "cash-flow", label: "💳 Flujo de Caja", description: "Proyección de entradas y salidas" },
  { value: "balance-sheet", label: "📊 Balance General", description: "Estado de situación financiera" },
  { value: "income-statement", label: "📈 Estado de Resultados", description: "Pérdidas y ganancias" },
  { value: "expense-report", label: "🧾 Reporte de Gastos", description: "Control detallado de gastos" },
  { value: "accounts-receivable", label: "📥 Cuentas por Cobrar", description: "Seguimiento de deudores" },
  { value: "accounts-payable", label: "📤 Cuentas por Pagar", description: "Control de obligaciones" },
  { value: "loan-amortization", label: "🏦 Amortización Préstamo", description: "Tabla de amortización de créditos" },
  { value: "tax-calculator", label: "🧮 Calculadora Impuestos", description: "Cálculo de impuestos y retenciones" },
  
  // Ventas y Marketing
  { value: "sales", label: "📈 Ventas", description: "Seguimiento de ventas y comisiones" },
  { value: "sales-forecast", label: "🔮 Pronóstico Ventas", description: "Proyección de ventas futuras" },
  { value: "client-database", label: "👥 Base de Clientes", description: "CRM básico con datos de clientes" },
  { value: "leads-tracker", label: "🎯 Seguimiento Leads", description: "Control de prospectos y oportunidades" },
  { value: "commission-calculator", label: "💵 Cálculo Comisiones", description: "Comisiones por vendedor" },
  { value: "marketing-campaign", label: "📣 Campaña Marketing", description: "Seguimiento de campañas publicitarias" },
  { value: "competitor-analysis", label: "🔍 Análisis Competencia", description: "Comparativa con competidores" },
  { value: "price-list", label: "💲 Lista de Precios", description: "Catálogo de productos con precios" },
  
  // Inventario y Logística
  { value: "inventory", label: "📦 Inventario", description: "Control de stock y productos" },
  { value: "warehouse-management", label: "🏭 Gestión Almacén", description: "Control de entradas y salidas" },
  { value: "stock-valuation", label: "💎 Valoración Stock", description: "Valoración de inventario" },
  { value: "purchase-orders", label: "🛒 Órdenes de Compra", description: "Seguimiento de pedidos a proveedores" },
  { value: "supplier-database", label: "🏪 Base Proveedores", description: "Directorio de proveedores" },
  { value: "shipping-tracker", label: "🚚 Seguimiento Envíos", description: "Control de entregas y logística" },
  
  // Recursos Humanos
  { value: "payroll", label: "👥 Nómina", description: "Cálculo de salarios y deducciones" },
  { value: "employee-database", label: "👤 Base Empleados", description: "Directorio de personal" },
  { value: "attendance-tracker", label: "⏰ Control Asistencia", description: "Registro de horas trabajadas" },
  { value: "vacation-tracker", label: "🏖️ Control Vacaciones", description: "Seguimiento de días libres" },
  { value: "performance-review", label: "📋 Evaluación Desempeño", description: "Evaluaciones de personal" },
  { value: "recruitment-tracker", label: "🎯 Seguimiento Reclutamiento", description: "Control de procesos de selección" },
  { value: "training-matrix", label: "📚 Matriz Capacitación", description: "Plan de formación y cursos" },
  { value: "overtime-calculator", label: "⏱️ Cálculo Horas Extra", description: "Control de tiempo extra" },
  
  // Gestión de Proyectos
  { value: "project", label: "📅 Gestión de Proyecto", description: "Cronograma y seguimiento de tareas" },
  { value: "gantt-chart", label: "📊 Diagrama Gantt", description: "Línea de tiempo del proyecto" },
  { value: "task-tracker", label: "✅ Seguimiento Tareas", description: "Lista de tareas con estados" },
  { value: "resource-allocation", label: "👥 Asignación Recursos", description: "Distribución de personal y recursos" },
  { value: "project-budget", label: "💰 Presupuesto Proyecto", description: "Control de costos del proyecto" },
  { value: "risk-register", label: "⚠️ Registro de Riesgos", description: "Identificación y mitigación de riesgos" },
  { value: "milestone-tracker", label: "🏁 Seguimiento Hitos", description: "Control de entregables clave" },
  
  // Facturación y Documentos
  { value: "invoice-tracker", label: "🧾 Control Facturas", description: "Registro y seguimiento de facturas" },
  { value: "invoice-template", label: "📄 Plantilla Factura", description: "Factura comercial con cálculos" },
  { value: "quote-template", label: "💼 Plantilla Cotización", description: "Presupuesto para clientes" },
  { value: "expense-claim", label: "🧾 Reembolso Gastos", description: "Solicitud de reembolso" },
  
  // KPIs y Métricas
  { value: "kpi", label: "🎯 KPIs", description: "Indicadores clave de rendimiento" },
  { value: "scorecard", label: "📊 Balanced Scorecard", description: "Cuadro de mando integral" },
  { value: "okr-tracker", label: "🎯 Seguimiento OKRs", description: "Objetivos y resultados clave" },
  { value: "metrics-dashboard", label: "📈 Panel de Métricas", description: "Indicadores consolidados" },
  
  // Reportes
  { value: "report", label: "📋 Informe General", description: "Reportes con tablas y resúmenes" },
  { value: "weekly-report", label: "📅 Informe Semanal", description: "Reporte de actividades semanales" },
  { value: "monthly-report", label: "📆 Informe Mensual", description: "Resumen mensual de operaciones" },
  { value: "annual-report", label: "📊 Informe Anual", description: "Reporte anual consolidado" },
  
  // Otros
  { value: "calendar", label: "📅 Calendario", description: "Calendario con eventos y fechas" },
  { value: "checklist", label: "✅ Lista de Verificación", description: "Checklist con estados" },
  { value: "contact-list", label: "📇 Directorio Contactos", description: "Lista de contactos organizada" },
  { value: "event-planner", label: "🎉 Planificador Eventos", description: "Organización de eventos" },
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
  const [importedCsvData, setImportedCsvData] = useState<unknown[][] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [includeCharts, setIncludeCharts] = useState(true);
  
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setPreview(null);
    setIsOpen(false);
    setIsEditing(false);
    setEditedContent("");
    setImportedCsvData(null);
    setCsvFileName("");
  };

  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCsv && !isExcel) {
      toast.error("Solo se aceptan archivos CSV o Excel (.xlsx, .xls)");
      return;
    }

    setIsImporting(true);

    try {
      // Use setTimeout to allow UI to update before heavy processing
      await new Promise(resolve => setTimeout(resolve, 50));

      if (isCsv) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const data: unknown[][] = [];

        for (const line of lines) {
          const cells: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim());

          const parsedCells = cells.map(cell => {
            const cleanCell = cell.replace(/^"|"$/g, '');
            const num = parseFloat(cleanCell.replace(/[,$%]/g, ''));
            return isNaN(num) || cleanCell === '' ? cleanCell : num;
          });
          
          if (parsedCells.some(cell => cell !== '')) {
            data.push(parsedCells);
          }
        }

        if (data.length > 0) {
          setImportedCsvData(data);
          setCsvFileName(file.name);
          toast.success(`CSV "${file.name}" importado con ${data.length} filas`);
        } else {
          toast.error("No se encontraron datos en el archivo CSV");
        }
      } else if (isExcel) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (data.length > 0) {
          setImportedCsvData(data);
          setCsvFileName(file.name);
          toast.success(`Excel "${file.name}" importado con ${data.length} filas`);
        } else {
          toast.error("No se encontraron datos en el archivo Excel");
        }
      }
    } catch (error) {
      console.error("Error importing file:", error);
      toast.error("Error al importar el archivo");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
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

  const handleRemoveCsv = () => {
    setImportedCsvData(null);
    setCsvFileName("");
    toast.info("CSV eliminado");
  };

  const parseCell = (cell: string): unknown => {
    const trimmed = cell.trim();
    
    // Preserve Excel formulas (starts with =)
    if (trimmed.startsWith('=')) {
      return { f: trimmed.substring(1) }; // xlsx-js-style formula format
    }
    
    // Try to convert numeric values (but not formulas)
    const num = parseFloat(trimmed.replace(/[,$%]/g, ''));
    return isNaN(num) ? trimmed : num;
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
          const parsedCells = cells.map(parseCell);
          data.push(parsedCells);
        }
      } else if (line.includes('\t')) {
        // Tab-separated values
        const cells = line.split('\t').map(cell => cell.trim());
        const parsedCells = cells.map(parseCell);
        data.push(parsedCells);
      } else if (line.includes(',')) {
        // CSV format
        const cells = line.split(',').map(cell => cell.trim());
        const parsedCells = cells.map(parseCell);
        data.push(parsedCells);
      }
    }
    
    return data.length > 0 ? data : [['Datos', 'Valor'], ['Ejemplo', 100]];
  };

  const applyFormulasToWorksheet = (worksheet: XLSX.WorkSheet, data: unknown[][]): void => {
    // Process each cell to apply formulas
    for (let r = 0; r < data.length; r++) {
      for (let c = 0; c < (data[r]?.length || 0); c++) {
        const cellValue = data[r][c];
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        
        // Check if this is a formula object
        if (cellValue && typeof cellValue === 'object' && 'f' in cellValue) {
          const formula = (cellValue as { f: string }).f;
          worksheet[cellAddress] = { 
            t: 'n', 
            f: formula,
            v: 0  // Placeholder value, Excel will calculate
          };
        }
      }
    }
  };

  const createWorkbookFromContent = (content: string, title: string, themeId?: string): XLSX.WorkBook => {
    const workbook = XLSX.utils.book_new();
    const theme = themeId ? getThemeById(themeId) : getRandomTheme();
    
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
        
        // Convert data to plain values for aoa_to_sheet
        const plainData = data.map(row => 
          (row as unknown[]).map(cell => 
            cell && typeof cell === 'object' && 'f' in cell ? '' : cell
          )
        );
        
        let worksheet = XLSX.utils.aoa_to_sheet(plainData);
        applyFormulasToWorksheet(worksheet, data);
        worksheet = applyThemeToSheet(worksheet, data, theme);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
      });
    } else {
      // Single sheet
      const data = parseContentToData(content);
      
      // Convert data to plain values for aoa_to_sheet
      const plainData = data.map(row => 
        (row as unknown[]).map(cell => 
          cell && typeof cell === 'object' && 'f' in cell ? '' : cell
        )
      );
      
      let worksheet = XLSX.utils.aoa_to_sheet(plainData);
      applyFormulasToWorksheet(worksheet, data);
      worksheet = applyThemeToSheet(worksheet, data, theme);
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

      // Convert imported CSV data to string format for AI processing
      let csvDataString = "";
      if (importedCsvData && importedCsvData.length > 0) {
        csvDataString = importedCsvData.map(row => (row as unknown[]).join(' | ')).join('\n');
      }

      const response = await supabase.functions.invoke('generate-xlsx', {
        body: { 
          templateType, 
          description, 
          customTitle: customTitle.trim() || undefined,
          importedData: csvDataString || undefined,
          includeCharts
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al generar el documento");
      }

      const { content, title } = response.data;
      const finalTitle = customTitle || title || templateOptions.find(t => t.value === templateType)?.label || "Documento";
      
      // Create workbook from content with random theme
      const randomTheme = getRandomTheme();
      const workbook = createWorkbookFromContent(content, finalTitle, randomTheme.id);
      
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
        themeId: randomTheme.id,
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
      const workbook = createWorkbookFromContent(editedContent, preview.title, preview.themeId);
      
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
          <div className="flex flex-col gap-3 overflow-hidden max-h-[65vh]">
            {/* Preview or Editor */}
            <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-muted max-h-[45vh]">
              {isEditing ? (
                <ScrollArea className="h-full max-h-[45vh]">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[200px] bg-background border-0 resize-none p-3 font-mono text-xs"
                    placeholder="Edita el contenido (formato tabla con | o comas)..."
                  />
                </ScrollArea>
              ) : (
                <ScrollArea className="h-full max-h-[45vh] p-3">
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
          <ScrollArea className="max-h-[60vh] pr-2">
          <div className="flex flex-col gap-3 mt-2">
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
              <SpeechTextarea
                placeholder={
                  templateType === "data-analysis" ? "Ej: Análisis de ventas mensuales con promedio, desviación estándar y tendencia..."
                  : templateType === "finance" ? "Ej: Control de gastos del hogar con categorías: alimentación, servicios, transporte..."
                  : templateType === "sales" ? "Ej: Seguimiento de ventas por vendedor con metas y comisiones del 5%..."
                  : templateType === "macros" ? "Ej: Macro para formatear automáticamente tablas y calcular totales..."
                  : "Describe los datos, columnas y cálculos que necesitas..."
                }
                value={description}
                onChange={setDescription}
                className="bg-background/50 border-border min-h-[60px]"
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/5000 caracteres
              </p>
            </div>

            {/* File Import Section */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Importar datos desde CSV o Excel (opcional)
              </label>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
              />
              {importedCsvData ? (
                <div className="border border-border rounded-lg p-3 bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{csvFileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCsv}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {importedCsvData.length} filas importadas • Los datos se usarán como base para el Excel
                  </p>
                  <div className="mt-2 max-h-[100px] overflow-auto border border-border/50 rounded text-xs">
                    <table className="w-full">
                      <tbody>
                        {importedCsvData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className={idx === 0 ? "bg-primary/10 font-medium" : ""}>
                            {(row as unknown[]).slice(0, 5).map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-2 py-1 border-r border-border/30 whitespace-nowrap">
                                {String(cell ?? '').substring(0, 20)}
                              </td>
                            ))}
                            {(row as unknown[]).length > 5 && <td className="px-2 py-1 text-muted-foreground">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importedCsvData.length > 5 && (
                      <p className="text-center py-1 text-muted-foreground">
                        ... y {importedCsvData.length - 5} filas más
                      </p>
                    )}
                  </div>
                </div>
              ) : isImporting ? (
                <div className="border-2 border-dashed border-primary rounded-lg p-6 text-center bg-primary/5">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm text-foreground font-medium">
                    Importando archivo...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Procesando datos
                  </p>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-md p-2 flex items-center gap-3 transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => csvInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Arrastra CSV/Excel o haz clic
                  </p>
                </div>
              )}
            </div>

            {/* Chart option */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-charts" 
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked === true)}
              />
              <label 
                htmlFor="include-charts" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                📊 Incluir hoja de gráficos con resumen visual
              </label>
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
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}