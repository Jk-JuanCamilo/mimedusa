import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-search`;
const SCRAPE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-scrape`;

const USER_NAME_KEY = "medussa_user_name";

// Detecta si el usuario quiere buscar en internet
function detectWebSearch(message: string): { type: 'search' | 'scrape' | null; query: string } {
  const searchPatterns = [
    /(?:busca|buscar|búscame|investiga|investigar|qué hay sobre|qué dice internet|información sobre|noticias de|noticias sobre|actualidad de|últimas noticias)\s+(.+)/i,
    /(?:search|look up|find info|what's new about)\s+(.+)/i,
  ];
  
  const urlPatterns = [
    /(?:analiza|analizar|resume|resumir|lee|leer|extrae|extraer|qué dice|contenido de)\s+(https?:\/\/[^\s]+)/i,
    /(?:analyze|summarize|read|extract from)\s+(https?:\/\/[^\s]+)/i,
    /(https?:\/\/[^\s]+)/i, // URL directa
  ];
  
  for (const pattern of searchPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return { type: 'search', query: match[1].trim() };
    }
  }
  
  for (const pattern of urlPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return { type: 'scrape', query: match[1].trim() };
    }
  }
  
  return { type: null, query: '' };
}

// Detecta el nombre del usuario en el mensaje
function extractUserName(message: string): string | null {
  const patterns = [
    /(?:me llamo|mi nombre es|soy|llámame|puedes llamarme|me dicen)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+)/i,
    /(?:i'm|my name is|call me|i am)\s+([A-Za-z]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Capitalizar primera letra
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
  }
  return null;
}

interface UseChatOptions {
  onMessageComplete?: (role: "user" | "assistant", content: string, imageUrl?: string) => void;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash-lite");
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem(USER_NAME_KEY);
  });
  
  // Guardar nombre en localStorage cuando cambie
  useEffect(() => {
    if (userName) {
      localStorage.setItem(USER_NAME_KEY, userName);
    }
  }, [userName]);
  
  const setMessagesExternal = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  const sendMessage = useCallback(async (input: string, model?: string, imageData?: string) => {
    // Detectar si el usuario dice su nombre
    const detectedName = extractUserName(input);
    if (detectedName) {
      setUserName(detectedName);
      toast.success(`¡Hola ${detectedName}! Ya recordaré tu nombre.`);
    }
    
    const userMsg: Message = { role: "user", content: input, imageUrl: imageData };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    
    // Notify about user message
    options?.onMessageComplete?.("user", input, imageData);

    // Check if user wants to generate an image
    const isImageRequest = input.toLowerCase().includes("genera una imagen") || 
                          input.toLowerCase().includes("generar imagen") ||
                          input.toLowerCase().includes("crea una imagen") ||
                          input.toLowerCase().includes("crear imagen") ||
                          input.toLowerCase().includes("dibuja") ||
                          input.toLowerCase().includes("generate image") ||
                          input.toLowerCase().includes("create image");

    if (isImageRequest) {
      try {
        // Verificar autenticación
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast.error("Debes iniciar sesión para generar imágenes");
          setMessages(prev => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }

        // Añadir mensaje de asistente temporal
        setMessages(prev => [...prev, { role: "assistant", content: "Generando imagen..." }]);
        
        const resp = await fetch(IMAGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ prompt: input }),
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({}));
          toast.error(errorData.error || "Error al generar la imagen");
          setMessages(prev => prev.slice(0, -2)); // Remove user msg and temp assistant msg
          setIsLoading(false);
          return;
        }

        const data = await resp.json();
        // Actualizar el mensaje del asistente con la imagen
        const assistantContent = data.text || "¡Aquí está tu imagen!";
        const imageUrl = data.imageUrl;
        setMessages(prev => prev.map((m, i) => 
          i === prev.length - 1 
            ? { role: "assistant", content: assistantContent, imageUrl }
            : m
        ));
        options?.onMessageComplete?.("assistant", assistantContent, imageUrl);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Image generation error:", error);
        toast.error("Error al generar la imagen");
        setMessages(prev => prev.slice(0, -2));
        setIsLoading(false);
        return;
      }
    }

    // Detectar si el usuario quiere buscar en internet o analizar una URL
    const webAction = detectWebSearch(input);
    let webContext = "";
    
    if (webAction.type === 'search') {
      try {
        setMessages(prev => [...prev, { role: "assistant", content: "🔍 Buscando en internet..." }]);
        
        const searchResp = await fetch(SEARCH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: webAction.query }),
        });
        
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.data && searchData.data.length > 0) {
            webContext = "\n\n📊 INFORMACIÓN DE INTERNET (actualizada):\n";
            searchData.data.slice(0, 3).forEach((result: any, i: number) => {
              webContext += `\n${i + 1}. **${result.title || 'Sin título'}**\n`;
              webContext += `   ${result.url}\n`;
              if (result.markdown) {
                webContext += `   ${result.markdown.slice(0, 500)}...\n`;
              }
            });
          }
        }
        // Quitar mensaje temporal
        setMessages(prev => prev.slice(0, -1));
      } catch (e) {
        console.error("Search error:", e);
        setMessages(prev => prev.slice(0, -1));
      }
    } else if (webAction.type === 'scrape') {
      try {
        setMessages(prev => [...prev, { role: "assistant", content: "📄 Analizando página web..." }]);
        
        const scrapeResp = await fetch(SCRAPE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webAction.query }),
        });
        
        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const content = scrapeData.data?.markdown || scrapeData.data?.summary;
          if (content) {
            webContext = `\n\n📄 CONTENIDO DE ${webAction.query}:\n${content.slice(0, 2000)}`;
          }
        }
        // Quitar mensaje temporal
        setMessages(prev => prev.slice(0, -1));
      } catch (e) {
        console.error("Scrape error:", e);
        setMessages(prev => prev.slice(0, -1));
      }
    }

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      // Chat es público - no requiere autenticación
      // Agregar contexto web si existe
      const userContent = webContext ? `${input}\n${webContext}` : input;
      // Preparar mensajes con imágenes si las hay
      const messagesForApi = [...messages, { ...userMsg, content: userContent }].map(msg => {
        if (msg.imageUrl) {
          return {
            role: msg.role,
            content: [
              { type: "text", text: msg.content },
              { type: "image_url", image_url: { url: msg.imageUrl } }
            ]
          };
        }
        return { role: msg.role, content: msg.content };
      });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          messages: messagesForApi,
          model: model || selectedModel,
          userName: userName,
          hasImage: !!imageData
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        
        if (resp.status === 429) {
          toast.error("Límite de solicitudes excedido. Intenta de nuevo más tarde.");
        } else if (resp.status === 402) {
          toast.error("Se requieren créditos adicionales.");
        } else {
          toast.error(errorData.error || "Error al conectar con Medussa IA");
        }
        
        setMessages(prev => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Handle remaining buffer
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }
      
      // Notify about completed assistant message
      if (assistantContent) {
        options?.onMessageComplete?.("assistant", assistantContent);
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Error de conexión. Intenta de nuevo.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, selectedModel, options, userName]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { 
    messages, 
    isLoading, 
    sendMessage, 
    clearChat, 
    selectedModel, 
    setSelectedModel,
    setMessages: setMessagesExternal,
    userName,
    setUserName
  };
}
