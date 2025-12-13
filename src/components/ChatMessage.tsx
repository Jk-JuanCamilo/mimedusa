import { cn } from "@/lib/utils";
import { Bot, User, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useMemo } from "react";
import { Document, Packer, Paragraph, TextRun } from "docx";
import XLSX from "xlsx-js-style";
import { getRandomTheme, applyThemeToSheet } from "@/utils/excelThemes";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export function ChatMessage({ role, content, imageUrl }: ChatMessageProps) {
  const isUser = role === "user";

  // Detectar tipo de contenido descargable
  const downloadInfo = useMemo(() => {
    const hasCodeBlock = content.includes("```");
    const isWordDocument = content.includes("DOCUMENTO WORD") || 
                          content.includes("documento editado") ||
                          content.includes("documento corregido") ||
                          content.includes("Aquí está tu documento");
    const isExcelDocument = content.includes("ARCHIVO EXCEL") ||
                           content.includes("Excel editado") ||
                           content.includes("hoja de cálculo") ||
                           content.includes("archivo Excel") ||
                           content.includes("datos de Excel") ||
                           content.includes("tabla Excel") ||
                           content.includes("📊") && (content.includes("Fila") || content.includes("Columna"));
    const hasEditableContent = content.includes("---CONTENIDO EDITADO---") || 
                               content.includes("Aquí está el contenido editado") ||
                               content.includes("archivo editado") ||
                               content.includes("contenido corregido") ||
                               hasCodeBlock;

    return { hasCodeBlock, isWordDocument, isExcelDocument, hasEditableContent };
  }, [content]);

  const handleDownload = useCallback(async () => {
    let downloadContent = content;
    let filename = "archivo_editado.txt";
    let mimeType = "text/plain";
    let isDocx = false;
    let isXlsx = false;

    // Extraer contenido del bloque de código si existe
    const codeBlockMatch = content.match(/```(\w+)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      const extension = codeBlockMatch[1] || "txt";
      downloadContent = codeBlockMatch[2].trim();
      
      // Determinar extensión y tipo MIME
      const extMap: Record<string, { ext: string; mime: string }> = {
        javascript: { ext: "js", mime: "text/javascript" },
        js: { ext: "js", mime: "text/javascript" },
        typescript: { ext: "ts", mime: "text/typescript" },
        ts: { ext: "ts", mime: "text/typescript" },
        python: { ext: "py", mime: "text/x-python" },
        py: { ext: "py", mime: "text/x-python" },
        html: { ext: "html", mime: "text/html" },
        css: { ext: "css", mime: "text/css" },
        json: { ext: "json", mime: "application/json" },
        xml: { ext: "xml", mime: "application/xml" },
        csv: { ext: "csv", mime: "text/csv" },
        sql: { ext: "sql", mime: "text/x-sql" },
        txt: { ext: "txt", mime: "text/plain" },
        word: { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        docx: { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        excel: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        xlsx: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      };
      
      const extInfo = extMap[extension.toLowerCase()] || { ext: extension, mime: "text/plain" };
      
      if (downloadInfo.isWordDocument || extension.toLowerCase() === "word" || extension.toLowerCase() === "docx") {
        isDocx = true;
        filename = "documento_editado.docx";
      } else if (downloadInfo.isExcelDocument || extension.toLowerCase() === "excel" || extension.toLowerCase() === "xlsx") {
        isXlsx = true;
        filename = "archivo_excel.xlsx";
      } else {
        filename = `archivo_editado.${extInfo.ext}`;
        mimeType = extInfo.mime;
      }
    } else if (downloadInfo.isWordDocument) {
      downloadContent = content
        .replace(/\*\*/g, '')
        .replace(/📄|✏️|📝|✅|📊|🔄|💡|⚠️/g, '')
        .trim();
      isDocx = true;
      filename = "documento_editado.docx";
    } else if (downloadInfo.isExcelDocument) {
      isXlsx = true;
      filename = "archivo_excel.xlsx";
    }

    if (isXlsx) {
      // Crear archivo Excel real (.xlsx) con tema aleatorio para variedad
      const workbook = XLSX.utils.book_new();
      const theme = getRandomTheme();
      
      // Intentar extraer datos tabulares del contenido
      const tableData: (string | number)[][] = [];
      const lines = downloadContent.split('\n');
      
      // Buscar líneas con formato de tabla (separadas por |)
      lines.forEach(line => {
        if (line.includes('|') && !line.startsWith('---') && !line.match(/^[-|]+$/)) {
          const cells = line.split('|').map(cell => {
            const trimmed = cell.trim();
            const num = parseFloat(trimmed.replace(/[,$%]/g, ''));
            return isNaN(num) ? trimmed : num;
          }).filter(cell => cell !== '');
          if (cells.length > 0) {
            tableData.push(cells);
          }
        } else if (line.startsWith('Fila')) {
          // Formato: "Fila X: valor1 | valor2 | valor3"
          const match = line.match(/Fila \d+:\s*(.+)/);
          if (match) {
            const cells = match[1].split('|').map(cell => {
              const trimmed = cell.trim();
              const num = parseFloat(trimmed.replace(/[,$%]/g, ''));
              return isNaN(num) ? trimmed : num;
            });
            tableData.push(cells);
          }
        }
      });

      // Si no se encontraron datos tabulares, crear una hoja con el contenido como texto
      if (tableData.length === 0) {
        const textRows = lines
          .filter(line => line.trim())
          .map(line => [line.replace(/\*\*/g, '').replace(/📊|📈|📋|🔢|📑|✏️|📝|✅|🔄|💡|⚠️|🛠️|📥|🎨/g, '').trim()]);
        tableData.push(...textRows);
      }

      let worksheet = XLSX.utils.aoa_to_sheet(tableData);
      worksheet = applyThemeToSheet(worksheet, tableData, theme);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
      
      // Generar archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (isDocx) {
      // Crear documento Word real (.docx)
      const paragraphs = downloadContent.split('\n').map(line => 
        new Paragraph({
          children: [new TextRun(line)],
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([downloadContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [content, downloadInfo.isWordDocument, downloadInfo.isExcelDocument]);

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg transition-all backdrop-blur-sm",
        isUser 
          ? "bg-secondary/40 ml-8 border border-border/30" 
          : "bg-card/60 mr-8 border border-border/50"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-primary/20 text-primary" 
            : "bg-accent/20 text-accent glow-accent"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <p className={cn(
          "text-xs font-medium",
          isUser ? "text-muted-foreground" : "text-accent"
        )}>
          {isUser ? "Tú" : "Medussa IA"}
        </p>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
        {!isUser && (downloadInfo.hasEditableContent || downloadInfo.isWordDocument || downloadInfo.isExcelDocument) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="mt-2 gap-2"
          >
            {downloadInfo.isExcelDocument ? (
              <FileSpreadsheet className="w-4 h-4" />
            ) : downloadInfo.isWordDocument ? (
              <FileText className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloadInfo.isExcelDocument 
              ? "Descargar Excel" 
              : downloadInfo.isWordDocument 
                ? "Descargar documento" 
                : "Descargar archivo"}
          </Button>
        )}
        {imageUrl && (
          <div className="mt-3 space-y-2">
            <img 
              src={imageUrl} 
              alt={isUser ? "Imagen adjunta por el usuario" : "Imagen generada por IA"}
              className="max-w-full rounded-lg border border-border/50 shadow-lg"
              style={{ maxHeight: '400px' }}
            />
            {!isUser && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = imageUrl;
                  a.download = "imagen_medussa.png";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar imagen
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
