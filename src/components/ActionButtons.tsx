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
import { ImagePlus, Code, User, FileUp, Loader2, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { PDFGeneratorDialog } from "./PDFGeneratorDialog";

interface ActionButtonsProps {
  onAction: (action: string, fileContent?: string) => void;
  disabled?: boolean;
  userName?: string | null;
  onUserNameChange?: (name: string | null) => void;
}

const actions = [
  {
    id: "image",
    label: "Generar Imagen",
    icon: ImagePlus,
    prompt: "Genera una imagen de un atardecer en la playa con palmeras y colores vibrantes"
  },
  {
    id: "code",
    label: "Crear App/Web",
    icon: Code,
    prompt: "Quiero crear una aplicación o sitio web para "
  },
];

export function ActionButtons({ onAction, disabled, userName, onUserNameChange }: ActionButtonsProps) {
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with prop when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && userName) {
      setName(userName);
    } else if (!open) {
      setName("");
    }
    setIsOpen(open);
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      const newName = name.trim();
      onUserNameChange?.(newName);
      localStorage.setItem("medussa_user_name", newName);
      toast.success(`¡Hola ${newName}! Ya recordaré tu nombre.`);
      setIsOpen(false);
      setName("");
    }
  };

  const handleDeleteName = () => {
    onUserNameChange?.(null);
    localStorage.removeItem("medussa_user_name");
    toast.success("Nombre eliminado");
    setIsOpen(false);
    setName("");
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
      // Handle Excel files (.xlsx, .xls)
      else if (extension === 'xlsx' || extension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        let excelContent = `📊 **ARCHIVO EXCEL**: "${file.name}"\n`;
        excelContent += `📑 **Hojas encontradas**: ${workbook.SheetNames.join(', ')}\n\n`;
        
        // Procesar cada hoja
        workbook.SheetNames.forEach((sheetName, idx) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          const rowCount = range.e.r - range.s.r + 1;
          const colCount = range.e.c - range.s.c + 1;
          
          excelContent += `---\n### 📋 Hoja ${idx + 1}: "${sheetName}"\n`;
          excelContent += `- Filas: ${rowCount} | Columnas: ${colCount}\n\n`;
          
          // Mostrar primeras 20 filas como vista previa
          const previewRows = jsonData.slice(0, 20);
          if (previewRows.length > 0) {
            excelContent += `**Vista previa de datos:**\n\`\`\`\n`;
            previewRows.forEach((row, rowIdx) => {
              const rowArray = row as unknown[];
              excelContent += `Fila ${rowIdx + 1}: ${rowArray.join(' | ')}\n`;
            });
            if (jsonData.length > 20) {
              excelContent += `... y ${jsonData.length - 20} filas más\n`;
            }
            excelContent += `\`\`\`\n\n`;
          }
          
          // Calcular estadísticas básicas para columnas numéricas
          const numericStats: Record<number, { values: number[], header: string }> = {};
          if (jsonData.length > 1) {
            const headers = jsonData[0] as unknown[];
            jsonData.slice(1).forEach(row => {
              const rowArray = row as unknown[];
              rowArray.forEach((cell, colIdx) => {
                const numVal = parseFloat(String(cell));
                if (!isNaN(numVal)) {
                  if (!numericStats[colIdx]) {
                    numericStats[colIdx] = { 
                      values: [], 
                      header: String(headers[colIdx] || `Columna ${colIdx + 1}`)
                    };
                  }
                  numericStats[colIdx].values.push(numVal);
                }
              });
            });
          }
          
          // Mostrar estadísticas si hay datos numéricos
          const statsEntries = Object.entries(numericStats);
          if (statsEntries.length > 0) {
            excelContent += `**📈 Estadísticas automáticas:**\n`;
            statsEntries.slice(0, 5).forEach(([_, stat]) => {
              const vals = stat.values;
              const sum = vals.reduce((a, b) => a + b, 0);
              const avg = sum / vals.length;
              const min = Math.min(...vals);
              const max = Math.max(...vals);
              excelContent += `- **${stat.header}**: Promedio=${avg.toFixed(2)}, Min=${min}, Max=${max}, Total=${sum.toFixed(2)}\n`;
            });
            excelContent += `\n`;
          }
        });
        
        fileType = "EXCEL";
        
        const prompt = `${excelContent}
**🛠️ PUEDO AYUDARTE CON:**
- ✏️ Editar celdas y datos específicos
- 📊 Crear resúmenes y análisis estadísticos completos
- 📈 Generar tablas dinámicas y reportes
- 🔢 Crear fórmulas y cálculos personalizados
- 📋 Generar macros VBA
- 🎨 Formatear y organizar datos
- 📥 Descargar el Excel editado

¿Qué necesitas hacer con este archivo Excel?`;

        onAction(prompt);
        toast.success(`Excel "${file.name}" analizado con ${workbook.SheetNames.length} hoja(s)`);
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
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2 bg-card/50 border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
          >
            <User className="w-4 h-4" />
            <span className="text-xs">
              {userName ? `Hola, ${userName}` : "Mi Nombre"}
            </span>
            {userName && <Edit2 className="w-3 h-3 opacity-60" />}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {userName ? "Editar tu nombre" : "¿Cómo te llamas?"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {userName && (
              <p className="text-sm text-muted-foreground">
                Nombre actual: <span className="text-foreground font-medium">{userName}</span>
              </p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={userName ? "Nuevo nombre..." : "Escribe tu nombre..."}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                className="bg-background/50 border-border"
                maxLength={50}
              />
              <Button onClick={handleNameSubmit} disabled={!name.trim()}>
                {userName ? "Cambiar" : "Guardar"}
              </Button>
            </div>
            {userName && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteName}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar nombre guardado
              </Button>
            )}
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

      {/* PDF Generator */}
      <PDFGeneratorDialog disabled={disabled} />

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
