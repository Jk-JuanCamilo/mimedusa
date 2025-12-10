import { cn } from "@/lib/utils";
import { Bot, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export function ChatMessage({ role, content, imageUrl }: ChatMessageProps) {
  const isUser = role === "user";

  // Detectar bloques de código o contenido editable
  const hasCodeBlock = content.includes("```");
  const hasEditableContent = content.includes("---CONTENIDO EDITADO---") || 
                             content.includes("Aquí está el contenido editado") ||
                             content.includes("archivo editado") ||
                             content.includes("contenido corregido") ||
                             hasCodeBlock;

  const handleDownload = useCallback(() => {
    let downloadContent = content;
    let filename = "archivo_editado.txt";
    let mimeType = "text/plain";

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
      };
      
      const extInfo = extMap[extension.toLowerCase()] || { ext: extension, mime: "text/plain" };
      filename = `archivo_editado.${extInfo.ext}`;
      mimeType = extInfo.mime;
    }

    const blob = new Blob([downloadContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content]);

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
        {!isUser && hasEditableContent && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="mt-2 gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar archivo
          </Button>
        )}
        {imageUrl && (
          <div className="mt-3 space-y-2">
            <img 
              src={imageUrl} 
              alt="Imagen generada por IA"
              className="max-w-full rounded-lg border border-border/50 shadow-lg"
              style={{ maxHeight: '400px' }}
            />
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
          </div>
        )}
      </div>
    </div>
  );
}
