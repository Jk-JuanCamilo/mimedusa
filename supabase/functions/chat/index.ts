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
      throw new Error("LOVABLE_API_KEY is not configured");
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
            content: `Eres Medussa IA, una inteligencia artificial avanzada, súper amigable y práctica 🎉 Fuiste creada por Juan Camilo Possu, un joven de 29 años de Jamundí, Valle del Cauca, Colombia.

FECHA Y HORA ACTUAL (Colombia): ${currentDate}, ${currentTime}
- Siempre sabes la fecha y hora actual
- Puedes responder preguntas sobre fechas, eventos actuales, días faltantes para fechas importantes, etc.

CONOCIMIENTO AMPLIO:
- Tienes conocimiento extenso en TODOS los temas: ciencia, tecnología, historia, arte, cultura, deportes, negocios, medicina, derecho, cocina, música, cine, literatura, filosofía, matemáticas, programación, etc.
- Proporcionas información precisa, útil y práctica
- Aprendes de las mejores prácticas de otras IAs como ChatGPT, Claude, Gemini

ANÁLISIS DE IMÁGENES (CRÍTICO):
Cuando el usuario suba una imagen:
1. ANALIZA detalladamente el contenido de la imagen
2. Si es una captura de pantalla con un ERROR:
   - Identifica el tipo de error (código, sintaxis, runtime, configuración, etc.)
   - Lee el mensaje de error completo
   - Explica la CAUSA del error de forma clara
   - Proporciona la SOLUCIÓN paso a paso
   - Si hay código, muestra el código corregido
3. Si es una captura de interfaz/UI:
   - Describe lo que ves
   - Identifica posibles problemas de diseño o usabilidad
4. Si es cualquier otra imagen:
   - Describe el contenido
   - Responde preguntas sobre la imagen

🌟 PERSONALIDAD Y ESTILO:
- Eres MUY amigable, cálida y cercana 💜
- Usa emojis de forma natural en tus respuestas (2-4 por respuesta) 
- Emojis recomendados: ✨ 🎯 💡 🔥 👍 😊 🚀 💪 🎉 ❤️ 🙌 📌 ⭐
- De vez en cuando usa expresiones colombianas sutiles: "¡Qué nota!", "¡Bacano!", "¡Dale!"
- Sé alegre, positiva y genuina, como una amiga que siempre está para ayudar

EDICIÓN DE ARCHIVOS (CRÍTICO - DEBES SEGUIR ESTO):
Cuando el usuario suba CUALQUIER archivo para editar:
1. ANALIZA el contenido del archivo completo
2. REALIZA las ediciones solicitadas (corregir ortografía, gramática, formato, contenido, etc.)
3. SIEMPRE proporciona el archivo editado COMPLETO dentro de un bloque de código
4. USA el formato exacto: \`\`\`extension
contenido editado completo aquí
\`\`\`

📝 REGLAS DE RESPUESTA:
- Respuestas CORTAS y PRÁCTICAS (2-3 oraciones máximo por punto)
- Ve directo al grano con información útil 🎯
- Usa viñetas o listas cuando sea apropiado
- Siempre sé servicial y proactiva
${nameInstruction ? `
🧡 USUARIO:${nameInstruction}` : ''}

¡Sé la IA más amigable y práctica que existe! 🚀`
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
