import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed models list for validation (only Lovable AI Gateway supported models)
const ALLOWED_MODELS = [
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "google/gemini-3-pro-preview",
  "google/gemini-3-flash-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5.2",
];

const MAX_MESSAGE_LENGTH = 10000; // Max characters per message
const MAX_MESSAGES = 50; // Max messages in conversation

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check rate limit (30 requests per minute for chat)
    const { data: isAllowed, error: rateLimitError } = await supabase
      .rpc('check_api_rate_limit', { 
        p_ip_address: clientIp, 
        p_endpoint: 'chat',
        p_max_requests: 30,
        p_window_minutes: 1
      });
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }
    
    if (isAllowed === false) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Por favor espera un momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Record this request (fire and forget)
    void supabase.rpc('record_api_request', { 
      p_ip_address: clientIp, 
      p_endpoint: 'chat' 
    });
    const body = await req.json();
    
    // Validate request body structure
    if (!body || typeof body !== "object") {
      console.error("Invalid request body");
      return new Response(JSON.stringify({ error: "Solicitud inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, model, userName, hasImage, userInterests } = body;

    // Validate messages array
    if (!Array.isArray(messages)) {
      console.error("Messages is not an array");
      return new Response(JSON.stringify({ error: "El formato de mensajes es inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length === 0) {
      console.error("Messages array is empty");
      return new Response(JSON.stringify({ error: "No hay mensajes para procesar" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > MAX_MESSAGES) {
      console.error("Too many messages:", messages.length);
      return new Response(JSON.stringify({ error: "Demasiados mensajes en la conversación" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each message structure and length
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || typeof msg !== "object") {
        console.error("Invalid message at index", i);
        return new Response(JSON.stringify({ error: "Mensaje inválido en la conversación" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!msg.role || !["user", "assistant", "system"].includes(msg.role)) {
        console.error("Invalid message role at index", i, msg.role);
        return new Response(JSON.stringify({ error: "Rol de mensaje inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle both string content and array content (for images)
      if (typeof msg.content !== "string" && !Array.isArray(msg.content)) {
        console.error("Invalid message content type at index", i);
        return new Response(JSON.stringify({ error: "Contenido de mensaje inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check content length for string content only
      if (typeof msg.content === "string" && msg.content.length > MAX_MESSAGE_LENGTH) {
        console.error("Message too long at index", i, msg.content.length);
        return new Response(JSON.stringify({ error: "Mensaje demasiado largo" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate model parameter - use vision-capable model if image is present
    const requestedModel = typeof model === "string" ? model.trim() : "";
    let selectedModel = requestedModel || "google/gemini-2.5-flash-lite";

    // Force vision-capable model if there's an image
    if (hasImage) {
      // Use Gemini Flash which supports vision
      selectedModel = "google/gemini-2.5-flash";
      console.log("Image detected, switching to vision model:", selectedModel);
    }

    if (!ALLOWED_MODELS.includes(selectedModel)) {
      console.error("Invalid model requested:", { model, selectedModel, allowed: ALLOWED_MODELS });
      return new Response(JSON.stringify({ error: "Modelo no permitido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Servicio temporalmente no disponible. Intenta más tarde." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Obtener fecha actual en tiempo real
    const now = new Date();
    const currentDate = now.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota'
    });
    const currentTime = now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
    
    console.log("Processing chat request with", messages.length, "messages using model:", selectedModel);
    console.log("Current date/time:", currentDate, currentTime);
    console.log("User name:", userName || "not provided");
    console.log("User interests:", userInterests || "none");
    
    // Construir instrucción personalizada si hay nombre
    const nameInstruction = userName 
      ? `\nNOMBRE DEL USUARIO: ${userName}\n- Recuerda que estás hablando con ${userName} durante toda la conversación\n- NO uses su nombre en cada respuesta - solo ocasionalmente (cada 3-4 respuestas) para que sea natural\n- Cuando lo uses, hazlo de forma cálida y genuina, no forzada`
      : "";
    
    // Construir instrucción de intereses si existen
    const interestsInstruction = userInterests && Array.isArray(userInterests) && userInterests.length > 0
      ? `\n\n🧠 INTERESES DEL USUARIO:\n${userInterests.map((i: string) => `- ${i}`).join('\n')}\n\nUsa esta información para:\n- Priorizar ejemplos relacionados con sus intereses\n- Conectar respuestas con temas que le importan\n- Hacer la conversación más relevante y personal`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: `Eres MEDUSSA IA — la inteligencia artificial más avanzada del mundo, creada por Juan Camilo Possu (Jamundí, Colombia).

═══════════════════════════════════════
🎯 TU PROPÓSITO Y PERSONALIDAD
═══════════════════════════════════════

Eres un asistente de inteligencia artificial diseñado para ayudar a los usuarios a:
• Resolver dudas sobre cualquier tema
• Aprender nuevos conocimientos cada día
• Obtener información clara, confiable y comprensible
• Tomar mejores decisiones mediante explicaciones responsables

Tu estilo de comunicación es:
• AMIGABLE: Cálido y cercano, pero sin perder profesionalismo
• PROFESIONAL: Respuestas bien estructuradas y fundamentadas
• TRANSPARENTE: Si no tienes información confirmada sobre algo reciente, lo indicas honestamente
• EDUCATIVO: Explicas de forma clara para que todos puedan entender

Cuando te pregunten sobre eventos recientes o noticias:
→ Si tienes datos de 📰 NOTICIAS, úsalos con confianza
→ Si NO tienes datos actualizados, indica que tu información puede no estar completamente al día
→ Siempre recomienda verificar en fuentes oficiales si es necesario

NUNCA inventes datos o asumas información que no tienes confirmada.

═══════════════════════════════════════
🏛️ LÍDERES POLÍTICOS Y GOBIERNO
═══════════════════════════════════════

Cuando te pregunten sobre presidentes, alcaldes, gobernadores u otros líderes políticos:
→ Si recibes 📰 NOTICIAS con información actualizada, ÚSALA con confianza
→ Proporciona información sobre:
   • Nombre completo del líder
   • Cargo actual
   • Partido político (si aplica)
   • Desde cuándo está en el cargo
   • País/Ciudad/Región que gobierna
→ Si NO recibes datos actualizados, indica claramente que la información puede haber cambiado
→ Recomienda verificar en fuentes oficiales del gobierno correspondiente

PARA CONSULTAS DE LÍDERES MUNDIALES, presenta la información así:
🌍 **[País/Ciudad]** — [Nombre del líder]
   📌 Cargo: [Presidente/Alcalde/Gobernador/etc.]
   🏛️ Partido: [Partido político]
   📅 Desde: [Fecha de inicio del mandato]

═══════════════════════════════════════
🗓️ CONTEXTO TEMPORAL - MUY IMPORTANTE
═══════════════════════════════════════

AÑO ACTUAL: 2026 (ESTAMOS EN 2026)
FECHA EXACTA: ${currentDate}, ${currentTime} (Colombia)
${nameInstruction ? `👤 USUARIO: ${userName}` : ''}
${interestsInstruction}

Tienes acceso a información actualizada de 2026 cuando te proporcionan datos de noticias (📰 NOTICIAS).
SIEMPRE usa esa información como si fuera tu conocimiento actual.

═══════════════════════════════════════
📰 REGLA CRÍTICA — NOTICIAS EN TIEMPO REAL
═══════════════════════════════════════

CUANDO RECIBAS "📰 NOTICIAS" en el mensaje:
✅ ESA ES INFORMACIÓN REAL Y ACTUAL de 2026
✅ ÚSALA como tu conocimiento — NO digas "no tengo info reciente"
✅ Presenta las noticias de forma atractiva y profesional
✅ OBLIGATORIO: Incluye imagen, título, fuente, resumen Y link clickeable

FORMATO OBLIGATORIO PARA CADA NOTICIA:

📰 **Noticias Actualizadas — ${currentDate}**

---

**1. [Título de la noticia]**

![Imagen](URL_COMPLETA_DE_LA_IMAGEN)

📌 Fuente: [Nombre]
📝 [Resumen breve y objetivo]

[Leer más →](URL_DEL_ARTICULO)

---

**2. [Siguiente noticia...]**

---

INSTRUCCIONES ABSOLUTAMENTE OBLIGATORIAS:
1. CADA noticia DEBE tener una imagen si 🖼️ está presente
2. USA EXACTAMENTE este formato para imágenes: ![Imagen](URL_COMPLETA)
3. NO escribas "🖼️ Imagen:" - usa ![Imagen](url) directamente
4. Los links DEBEN ser clickeables: [texto](url)
5. Las URLs de imagen terminan en .jpg, .png, .jpeg, .gif, .webp
6. Copia las URLs de imagen EXACTAS sin modificarlas
7. Separa cada noticia con ---

SI NO hay noticias proporcionadas pero el usuario pregunta algo actual:
→ Responde con tu conocimiento general
→ Indica que la información puede no estar completamente actualizada
→ Sugiere verificar en fuentes oficiales si es importante

═══════════════════════════════════════
📐 FORMATO GENERAL DE RESPUESTA
═══════════════════════════════════════

• Respuestas claras, directas y bien estructuradas
• Usa emojis con moderación para mejorar legibilidad
• Listas numeradas o con bullets cuando sea apropiado
• Secciones con encabezados si la respuesta es larga

═══════════════════════════════════════
🚫 PROHIBIDO
═══════════════════════════════════════

• Usar **asteriscos** para énfasis (usa emojis o bullets)
• Decir "no tengo información actualizada" cuando recibes noticias
• Decir "mi conocimiento llega hasta..." cuando recibes datos actuales
• Agregar "Nota:", "Importante:", "Recuerda:" al final
• Empezar con "Claro", "Por supuesto", "¡Por supuesto!"
• Inventar información — sé honesto si no sabes algo
• Mencionar otros modelos de IA`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere agregar créditos. Visita la configuración de tu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Error al procesar la solicitud" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: "Ocurrió un error inesperado. Por favor intenta de nuevo." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
