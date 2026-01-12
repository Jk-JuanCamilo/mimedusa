import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from "./useUserPreferences";

export interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export interface StreamingStats {
  tokensPerSecond: number;
  totalTokens: number;
  elapsedTime: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-search`;
const SCRAPE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-scrape`;
const NEWS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-news`;
const WIKIDATA_MAYOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-wikidata-mayor`;
const USER_NAME_KEY = "medussa_user_name";

// Detecta si el usuario pregunta por un alcalde específico
function detectMayorQuery(message: string): { isMayorQuery: boolean; ciudad: string } {
  const lowerMsg = message.toLowerCase();
  
  // Palabras que indican fin del nombre de ciudad
  const stopWords = ['quien', 'quién', 'es', 'cual', 'cuál', 'como', 'cómo', 'dime', 'por favor', 'actual', 'actualmente'];
  
  // Patrones para detectar preguntas de alcaldes - ordenados de más específico a menos
  const mayorPatterns = [
    // "alcalde de medellín" o "alcalde de la ciudad de medellín"
    /(?:alcalde|alcaldesa)\s+(?:de\s+)?(?:la\s+ciudad\s+de\s+)?([a-záéíóúñü\s]+)/i,
    // "quién es el alcalde de medellín"
    /(?:quién|quien)\s+es\s+(?:el|la)\s+(?:alcalde|alcaldesa)\s+(?:de\s+)?([a-záéíóúñü\s]+)/i,
    // "el alcalde de medellín quién es"
    /(?:el|la)\s+(?:alcalde|alcaldesa)\s+(?:de\s+)?([a-záéíóúñü\s]+)/i,
  ];
  
  for (const pattern of mayorPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Limpiar el nombre de la ciudad - remover palabras de parada al final
      let ciudad = match[1]
        .replace(/[¿?¡!,;:.]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      // Remover palabras de parada del final
      for (const stopWord of stopWords) {
        if (ciudad.endsWith(' ' + stopWord)) {
          ciudad = ciudad.slice(0, -(stopWord.length + 1)).trim();
        }
        if (ciudad.startsWith(stopWord + ' ')) {
          ciudad = ciudad.slice(stopWord.length + 1).trim();
        }
      }
      
      // Capitalizar primera letra
      ciudad = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
      
      if (ciudad.length > 1) {
        return { isMayorQuery: true, ciudad };
      }
    }
  }
  
  return { isMayorQuery: false, ciudad: '' };
}

// Detecta si el usuario quiere buscar en internet o necesita info actualizada
function detectWebSearch(message: string): { type: 'search' | 'scrape' | 'news' | null; query: string } {
  const lowerMsg = message.toLowerCase();
  
  // Patrones de NOTICIAS - palabras clave SUPER ampliadas para 2026
  const newsKeywords = [
    // Palabras directas de noticias
    'noticias', 'noticia', 'últimas noticias', 'última hora', 'breaking news', 'news',
    'qué está pasando', 'qué pasó', 'qué pasa', 'actualidad', 'novedades', 'novedad',
    'hoy en', 'esta semana', 'ayer', 'reciente', 'tendencias', 'trending',
    // Eventos importantes
    'mundial', 'elecciones', 'guerra', 'crisis', 'escándalo', 'fallecio', 'murió', 'murio',
    'accidente', 'terremoto', 'huracán', 'huracan', 'atentado', 'incendio', 'explosión',
    // Finanzas
    'precio del', 'cotización', 'cotizacion', 'bolsa de valores', 'bitcoin', 'criptomonedas', 
    'dólar hoy', 'dolar hoy', 'euro hoy', 'mercado', 'inflación', 'inflacion',
    // Deportes
    'marcador', 'partido', 'copa', 'champions', 'eliminatoria', 'clasificación', 'fichaje',
    'gol de', 'resultado del', 'cómo quedó', 'como quedo', 'ganó', 'gano', 'perdió', 'perdio',
    // Preguntas sobre eventos
    'que paso con', 'qué pasó con', 'que sucedio', 'qué sucedió', 'ultima noticia de', 
    'última noticia de', 'que hay de', 'qué hay de', 'cuéntame de', 'cuentame de',
    'sabías que', 'sabias que', 'es cierto que', 'es verdad que',
    // Entretenimiento
    'celebridad', 'famoso', 'actor', 'actriz', 'cantante', 'película', 'pelicula', 'serie',
    // LÍDERES POLÍTICOS Y GOBIERNO - MUY AMPLIADO
    'presidente', 'presidenta', 'alcalde', 'alcaldesa', 'gobernador', 'gobernadora',
    'ministro', 'ministra', 'senador', 'senadora', 'diputado', 'diputada',
    'primer ministro', 'primera ministra', 'canciller', 'secretario de estado',
    'congreso', 'parlamento', 'senado', 'cámara', 'gobierno de', 'gabinete',
    'ley', 'protesta', 'manifestación', 'manifestacion', 'decreto', 'reforma',
    'quién gobierna', 'quien gobierna', 'quién manda', 'quien manda',
    'líder de', 'lider de', 'jefe de estado', 'jefe de gobierno',
    // Países y capitales (para consultas de líderes)
    'estados unidos', 'eeuu', 'usa', 'méxico', 'mexico', 'argentina', 'brasil', 'chile',
    'perú', 'peru', 'venezuela', 'ecuador', 'bolivia', 'uruguay', 'paraguay',
    'españa', 'espana', 'francia', 'alemania', 'italia', 'reino unido', 'rusia', 'china',
    'japón', 'japon', 'india', 'canadá', 'canada', 'australia',
    // Colombia específico - ciudades y departamentos
    'colombia', 'bogotá', 'bogota', 'medellín', 'medellin', 'cali', 'barranquilla',
    'cartagena', 'bucaramanga', 'pereira', 'manizales', 'santa marta', 'cúcuta', 'cucuta',
    'ibagué', 'ibague', 'villavicencio', 'pasto', 'montería', 'monteria', 'neiva',
    'antioquia', 'valle del cauca', 'cundinamarca', 'atlántico', 'atlantico', 'santander',
    'jamundí', 'jamundi', 'palmira', 'tuluá', 'tulua', 'buenaventura', 'buga',
    // Información actualizada 2026
    'hoy', 'ahora', 'actual', 'actualizado', 'este año', '2026', '2025',
    'últimamente', 'recientemente', 'en este momento', 'actualmente',
    'qué hay de nuevo', 'algo nuevo', 'lo más reciente', 'lo último',
    // Tecnología
    'ia', 'inteligencia artificial', 'gpt', 'gemini', 'claude', 'chatgpt',
    'iphone', 'android', 'apple', 'google', 'microsoft', 'meta', 'tesla',
    'spacex', 'starlink', 'neuralink', 'openai', 'nvidia', 'amd',
    // Clima
    'clima', 'tiempo', 'pronóstico', 'pronostico', 'temperatura', 'lluvia',
    // Eventos globales
    'g20', 'onu', 'otan', 'cumbre', 'tratado', 'acuerdo', 'sanción',
    // Personas famosas y líderes mundiales (buscar información actualizada)
    'elon musk', 'trump', 'biden', 'petro', 'milei', 'lula', 'maduro', 'boric',
    'amlo', 'sheinbaum', 'xi jinping', 'putin', 'zelensky', 'macron', 'scholz',
    'sunak', 'modi', 'trudeau', 'netanyahu', 'el papa', 'francisco'
  ];
  
  // Preguntas que implícitamente necesitan información actual
  const implicitCurrentPatterns = [
    // Líderes políticos
    /quién es el (?:presidente|presidenta|alcalde|alcaldesa|gobernador|gobernadora|ministro|ministra|líder|lider|ceo|director)/i,
    /quien es el (?:presidente|presidenta|alcalde|alcaldesa|gobernador|gobernadora|ministro|ministra|líder|lider|ceo|director)/i,
    /quién es la (?:presidente|presidenta|alcalde|alcaldesa|gobernador|gobernadora|ministra|líder|lider|directora)/i,
    /quien es la (?:presidente|presidenta|alcalde|alcaldesa|gobernador|gobernadora|ministra|líder|lider|directora)/i,
    /quiénes son los (?:presidentes|alcaldes|gobernadores|ministros|líderes|lideres)/i,
    /quienes son los (?:presidentes|alcaldes|gobernadores|ministros|líderes|lideres)/i,
    /alcalde de/i,
    /presidente de/i,
    /gobernador de/i,
    /gobierno de/i,
    /gobierna (?:en|a)/i,
    // Preguntas generales de actualidad
    /cuánto (?:está|vale|cuesta)/i,
    /cuanto (?:está|vale|cuesta)/i,
    /cómo está (?:el|la)/i,
    /como está (?:el|la)/i,
    /qué (?:pasó|pasa|sucede|ocurre)/i,
    /que (?:pasó|pasa|sucede|ocurre)/i,
    /dónde está/i,
    /donde está/i,
    /cuál es (?:el|la) (?:último|última|actual)/i,
    /cual es (?:el|la) (?:último|última|actual)/i,
    /hay alguna/i,
    /existe algún/i,
    /se (?:anunció|lanzó|publicó)/i,
    /cuándo (?:es|será|fue)/i,
    /cuando (?:es|será|fue)/i
  ];
  
  // Detectar si necesita noticias/info actual
  const needsNews = newsKeywords.some(keyword => lowerMsg.includes(keyword)) ||
                    implicitCurrentPatterns.some(pattern => pattern.test(lowerMsg));
  
  // Patrones de búsqueda explícita
  const searchPatterns = [
    /(?:busca|buscar|búscame|investiga|investigar|qué hay sobre|qué dice internet|información sobre|noticias de|noticias sobre|actualidad de|últimas noticias|dime sobre|cuéntame sobre|explícame sobre)\s+(.+)/i,
    /(?:search|look up|find info|what's new about|tell me about|what happened with)\s+(.+)/i,
  ];
  
  // Patrones de URLs
  const urlPatterns = [
    /(?:analiza|analizar|resume|resumir|lee|leer|extrae|extraer|qué dice|contenido de)\s+(https?:\/\/[^\s]+)/i,
    /(?:analyze|summarize|read|extract from)\s+(https?:\/\/[^\s]+)/i,
    /(https?:\/\/[^\s]+)/i,
  ];
  
  // Primero verificar URLs
  for (const pattern of urlPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return { type: 'scrape', query: match[1].trim() };
    }
  }
  
  // Luego búsquedas explícitas - prioridad a noticias
  for (const pattern of searchPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      // Si menciona noticias, usar tipo news
      if (lowerMsg.includes('noticia')) {
        return { type: 'news', query: match[1].trim() };
      }
      return { type: 'search', query: match[1].trim() };
    }
  }
  
  // Si contiene keywords de noticias, buscar automáticamente
  if (needsNews) {
    // Extraer el tema principal del mensaje
    const cleanQuery = message
      .replace(/^(cuáles son las|cuál es la|dime las|dame las|qué|cuáles|cómo|dónde|cuándo|por qué|que|como|donde|cuando)\s*/i, '')
      .trim();
    return { type: 'news', query: cleanQuery || message };
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
  const [streamingStats, setStreamingStats] = useState<StreamingStats | null>(null);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash-lite");
  const [userName, setUserName] = useState<string | null>(() => {
    return localStorage.getItem(USER_NAME_KEY);
  });
  
  // Hook de preferencias de usuario para memoria y personalización
  const { updateFromMessage, getPreferencesContext, mainInterests } = useUserPreferences();
  
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
    const mayorQuery = detectMayorQuery(input);
    let webContext = "";
    
    // Función auxiliar para obtener noticias de fuentes confiables (sin autenticación requerida)
    const fetchNews = async (query: string) => {
      try {
        setMessages(prev => [...prev, { role: "assistant", content: "📰 Buscando noticias de fuentes confiables..." }]);
        
        const newsResp = await fetch(NEWS_URL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 8 }),
        });
        
        if (newsResp.ok) {
          const newsData = await newsResp.json();
          if (newsData.articles && newsData.articles.length > 0) {
            webContext = "\n\n📰 NOTICIAS DE FUENTES CONFIABLES:\n";
            webContext += `🕐 Actualizado: ${new Date().toLocaleString('es-CO')}\n`;
            webContext += `📡 Fuentes verificadas\n\n`;
            
            newsData.articles.forEach((article: any, i: number) => {
              webContext += `**${i + 1}. ${article.title}**\n`;
              webContext += `   📌 Fuente: ${article.source.name}\n`;
              webContext += `   📝 ${article.description}\n`;
              webContext += `   🔗 Link: ${article.url}\n`;
              if (article.image) {
                webContext += `   🖼️ Imagen: ${article.image}\n`;
              }
              webContext += `\n`;
            });
            
            webContext += "\n⚠️ INSTRUCCIONES CRÍTICAS PARA MOSTRAR NOTICIAS:\n";
            webContext += "1. INCLUYE SIEMPRE las imágenes usando el formato: ![Descripción](URL_IMAGEN)\n";
            webContext += "2. INCLUYE SIEMPRE los links como enlaces clickeables: [Ver más](URL)\n";
            webContext += "3. Formato para cada noticia: imagen, título, fuente, descripción, link\n";
            webContext += "4. Usa markdown para que los links e imágenes sean interactivos\n";
          }
        } else {
          console.error("News fetch error:", newsResp.status);
        }
        setMessages(prev => prev.slice(0, -1));
      } catch (e) {
        console.error("News fetch error:", e);
        setMessages(prev => prev.slice(0, -1));
      }
    };

    // Función auxiliar para obtener alcalde desde Wikidata
    const fetchMayorFromWikidata = async (ciudad: string) => {
      try {
        setMessages(prev => [...prev, { role: "assistant", content: `🏛️ Consultando Wikidata para información del alcalde de ${ciudad}...` }]);
        
        const wikidataResp = await fetch(WIKIDATA_MAYOR_URL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ciudad }),
        });
        
        if (wikidataResp.ok) {
          const wikidataData = await wikidataResp.json();
          if (wikidataData.success && wikidataData.results && wikidataData.results.length > 0) {
            webContext = "\n\n🏛️ INFORMACIÓN DE WIKIDATA (Base de datos estructurada):\n";
            webContext += `🕐 Consultado: ${new Date().toLocaleString('es-CO')}\n`;
            webContext += `📚 Fuente: Wikidata (base de conocimiento de Wikipedia)\n\n`;
            
            wikidataData.results.forEach((result: any, i: number) => {
              webContext += `**Alcalde encontrado:**\n`;
              webContext += `   👤 **Nombre:** ${result.alcalde}\n`;
              webContext += `   🏙️ **Ciudad:** ${result.ciudad}\n`;
              if (result.pais) {
                webContext += `   🌍 **País:** ${result.pais}\n`;
              }
              if (result.fechaInicio) {
                webContext += `   📅 **Desde:** ${result.fechaInicio}\n`;
              }
              if (result.imagen) {
                webContext += `   🖼️ **Imagen:** ${result.imagen}\n`;
              }
              webContext += `\n`;
            });
            
            webContext += "\n⚠️ INSTRUCCIONES PARA RESPONDER:\n";
            webContext += "1. Presenta la información de manera clara y estructurada\n";
            webContext += "2. Indica que la fuente es Wikidata\n";
            webContext += "3. Si hay imagen, muéstrala con formato markdown: ![Alcalde](URL)\n";
            webContext += "4. Menciona que la información puede no estar 100% actualizada\n";
          } else if (wikidataData.error) {
            webContext = `\n\n⚠️ No se encontró información del alcalde de "${ciudad}" en Wikidata.\n`;
            webContext += "Esto puede significar que:\n";
            webContext += "- La ciudad no está registrada en Wikidata con ese nombre\n";
            webContext += "- La información del alcalde actual no ha sido actualizada\n";
            webContext += "- El nombre de la ciudad puede estar escrito diferente\n";
          }
        } else {
          console.error("Wikidata fetch error:", wikidataResp.status);
        }
        setMessages(prev => prev.slice(0, -1));
      } catch (e) {
        console.error("Wikidata fetch error:", e);
        setMessages(prev => prev.slice(0, -1));
      }
    };

    // Función auxiliar para búsqueda web (requiere autenticación)
    const performWebSearch = async (query: string) => {
      const { data: { session: searchSession } } = await supabase.auth.getSession();
      if (!searchSession?.access_token) {
        console.log("Web search requires authentication");
        return;
      }
      
      try {
        setMessages(prev => [...prev, { role: "assistant", content: "🔍 Buscando en internet..." }]);
        
        const searchResp = await fetch(SEARCH_URL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${searchSession.access_token}`,
          },
          body: JSON.stringify({ 
            query,
            options: { limit: 5, lang: 'es', country: 'co' }
          }),
        });
        
        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.data && searchData.data.length > 0) {
            webContext = "\n\n📊 INFORMACIÓN DE INTERNET (actualizada):\n";
            searchData.data.slice(0, 5).forEach((result: any, i: number) => {
              webContext += `\n${i + 1}. **${result.title || 'Sin título'}**\n`;
              webContext += `   ${result.url}\n`;
              if (result.markdown) {
                webContext += `   ${result.markdown.slice(0, 500)}...\n`;
              }
            });
          }
        } else if (searchResp.status === 401) {
          console.log("Search requires authentication");
        }
        setMessages(prev => prev.slice(0, -1));
      } catch (e) {
        console.error("Search error:", e);
        setMessages(prev => prev.slice(0, -1));
      }
    };
    
    // Prioridad: primero consultar Wikidata si es pregunta de alcalde
    if (mayorQuery.isMayorQuery) {
      await fetchMayorFromWikidata(mayorQuery.ciudad);
    } else if (webAction.type === 'search') {
      await performWebSearch(webAction.query);
    } else if (webAction.type === 'news') {
      await fetchNews(webAction.query);
    } else if (webAction.type === 'scrape') {
      try {
        setMessages(prev => [...prev, { role: "assistant", content: "📄 Analizando página web..." }]);
        
        const { data: { session: scrapeSession } } = await supabase.auth.getSession();
        const scrapeHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (scrapeSession?.access_token) {
          scrapeHeaders.Authorization = `Bearer ${scrapeSession.access_token}`;
        }

        const scrapeResp = await fetch(SCRAPE_URL, {
          method: "POST",
          headers: scrapeHeaders,
          body: JSON.stringify({ url: webAction.query }),
        });
        
        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const content = scrapeData.data?.markdown || scrapeData.data?.summary;
          if (content) {
            webContext = `\n\n📄 CONTENIDO DE ${webAction.query}:\n${content.slice(0, 2000)}`;
          }
        }
        setMessages(prev => prev.slice(0, -1));
      } catch (e) {
        console.error("Scrape error:", e);
        setMessages(prev => prev.slice(0, -1));
      }
    }

    let assistantContent = "";
    let tokenCount = 0;
    let streamStartTime: number | null = null;

    const updateAssistant = (chunk: string) => {
      if (!streamStartTime) {
        streamStartTime = Date.now();
      }
      
      assistantContent += chunk;
      tokenCount += chunk.split(/\s+/).filter(Boolean).length; // Approximate token count
      
      const elapsedTime = (Date.now() - streamStartTime) / 1000;
      const tokensPerSecond = elapsedTime > 0 ? Math.round(tokenCount / elapsedTime) : 0;
      
      setStreamingStats({
        tokensPerSecond,
        totalTokens: tokenCount,
        elapsedTime: Math.round(elapsedTime * 10) / 10
      });
      
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
      // Actualizar preferencias basándose en el mensaje
      updateFromMessage(input);
      
      // Agregar contexto web y preferencias del usuario si existen
      const preferencesContext = getPreferencesContext();
      const userContent = webContext || preferencesContext 
        ? `${input}${webContext}${preferencesContext}` 
        : input;
      
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

      // Chat es público - obtener token solo si existe para mejor tracking
      const { data: { session: chatSession } } = await supabase.auth.getSession();
      const chatHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (chatSession?.access_token) {
        chatHeaders.Authorization = `Bearer ${chatSession.access_token}`;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: chatHeaders,
        body: JSON.stringify({
          messages: messagesForApi,
          model: model || selectedModel,
          userName: userName,
          hasImage: !!imageData,
          userInterests: mainInterests
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        
        if (resp.status === 401) {
          toast.error("Sesión expirada. Por favor inicia sesión de nuevo.");
        } else if (resp.status === 429) {
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
      setStreamingStats(null);
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
    setUserName,
    streamingStats,
    mainInterests
  };
}
