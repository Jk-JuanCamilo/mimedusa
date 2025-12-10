import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/hooks/useConversations";

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onDeleteAllConversations: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onDeleteAllConversations,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-72 bg-card/95 backdrop-blur-md border-r border-border z-50",
        "flex flex-col transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Historial</h2>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onNewConversation}
              title="Nueva conversación"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="md:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          {conversations.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm p-4">
              No hay conversaciones guardadas
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                    currentConversationId === conv.id
                      ? "bg-primary/20 text-foreground"
                      : "hover:bg-muted/50 text-muted-foreground"
                  )}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate text-sm">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Delete All Button */}
        {conversations.length > 0 && (
          <div className="p-3 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar todo el historial
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar todo el historial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará todas tus conversaciones permanentemente. No se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDeleteAllConversations}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </>
  );
}
