import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

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
      </div>
    </div>
  );
}
