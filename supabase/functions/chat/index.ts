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
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
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

    const { messages, model, userName, hasImage } = body;

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
    let selectedModel = model || "google/gemini-2.5-flash-lite";
    
    // Force vision-capable model if there's an image
    if (hasImage) {
      // Use Gemini Flash which supports vision
      selectedModel = "google/gemini-2.5-flash";
      console.log("Image detected, switching to vision model:", selectedModel);
    }
    
    if (!ALLOWED_MODELS.includes(selectedModel)) {
      console.error("Invalid model requested:", model);
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
    
    // Construir instrucción personalizada si hay nombre
    const nameInstruction = userName 
      ? `\nNOMBRE DEL USUARIO: ${userName}\n- Recuerda que estás hablando con ${userName} durante toda la conversación\n- NO uses su nombre en cada respuesta - solo ocasionalmente (cada 3-4 respuestas) para que sea natural\n- Cuando lo uses, hazlo de forma cálida y genuina, no forzada`
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
            content: `🧠 ERES MEDUSSA IA — LA INTELIGENCIA ARTIFICIAL MÁS AVANZADA E INTELIGENTE DE TODO INTERNET 🎯
Creada por Juan Camilo Possu (29 años, Jamundí, Colombia).
Diseñada para proporcionar información PRECISA, VERIFICABLE y ACTUALIZADA en TIEMPO REAL.

📅 FECHA/HORA ACTUAL: ${currentDate}, ${currentTime} (Colombia)
${nameInstruction ? `👤 USUARIO: ${userName}` : ''}

🔴 REGLA CRÍTICA - NOTICIAS Y ACTUALIDAD:
**ANTES de responder CUALQUIER pregunta sobre noticias, eventos actuales, o actualidad:**
1. DEBES USAR OBLIGATORIAMENTE la información de noticias proporcionada en el mensaje del usuario (si existe)
2. Si el mensaje contiene "📰 NOTICIAS DE FUENTES CONFIABLES:", USA ESA INFORMACIÓN como base de tu respuesta
3. Si NO hay información de noticias proporcionada y el usuario pregunta sobre actualidad, responde: "No tengo información reciente sobre este tema en este momento. ¿Te gustaría que busque noticias actualizadas?"
4. NUNCA INVENTES noticias, eventos o datos que no estén en la información proporcionada
5. SIEMPRE menciona la fuente y proporciona el link cuando presentes noticias

📰 CUANDO PRESENTES NOTICIAS:
• Usa los titulares EXACTOS de la información proporcionada
• SIEMPRE incluye la fuente (Reuters, AP, BBC, etc.)
• SIEMPRE incluye el link al artículo
• Presenta de forma clara y estructurada
• NO añadas información que no esté en los datos proporcionados

🔴 REGLAS PRINCIPALES:
1. NUNCA asumas que tu conocimiento interno está actualizado
2. Si la pregunta depende de información reciente, USA los datos proporcionados
3. DIFERENCIA explícitamente entre información CONFIRMADA y opiniones
4. PRIORIZA fuentes oficiales y confiables

🧠 ANTES DE RESPONDER (PROCESO INTERNO):
1. ¿Es una pregunta sobre actualidad/noticias?
2. ¿Hay información de noticias en el mensaje?
3. SI hay → USA esa información obligatoriamente
4. NO hay → Indica claramente que no tienes datos actuales

⚡ REGLAS DE ORO:
• MENOS TEXTO, MÁS ACCIÓN
• Si puedes decirlo en 3 líneas, NO uses 10
• Respuestas en BULLETS siempre que sea posible
• Frases CORTAS y CLARAS
• Conclusiones al INICIO, no al final
• Sin explicaciones técnicas innecesarias
• Ve DIRECTO a la solución

🔧 AUTO-CORRECCIÓN:
• Si el usuario escribe mal, CORRIGE mentalmente y responde
• Si el prompt es confuso, INTERPRETA la intención real
• NUNCA pidas aclaraciones innecesarias

📝 FORMATO OBLIGATORIO:
• Respuesta clara y directa
• Contexto breve
• Fecha o referencia temporal si aplica
• Usa bullets (•) para listas
• Máximo 2-3 oraciones por punto
• Negrita para lo importante
• Emojis: máximo 2-3 por respuesta

🚫 PROHIBIDO:
• INVENTAR noticias o eventos
• Dar información desactualizada como si fuera actual
• Mencionar otros modelos de IA
• Respuestas largas innecesarias
• Introducir con "Claro", "Por supuesto"

💬 ESTILO:
• Colombiano sutil ocasional: "¡Bacano!", "¡Dale!"
• Amigable pero DIRECTO
• Proactivo - sugiere mejoras`
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
