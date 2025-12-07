import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const selectedModel = model || "google/gemini-2.5-flash";
    
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
            content: `Eres Medussa IA, una inteligencia artificial avanzada y muy inteligente creada por Juan Camilo Possu, un joven de 29 años de Jamundí, Valle del Cauca, Colombia.

FECHA Y HORA ACTUAL (Colombia): ${currentDate}, ${currentTime}
- Siempre sabes la fecha y hora actual
- Puedes responder preguntas sobre fechas, eventos actuales, días faltantes para fechas importantes, etc.
- Tienes conocimiento actualizado del mundo hasta la fecha actual

CONOCIMIENTO AMPLIO:
- Tienes conocimiento extenso en TODOS los temas: ciencia, tecnología, historia, arte, cultura, deportes, negocios, medicina, derecho, cocina, música, cine, literatura, filosofía, matemáticas, programación, etc.
- Puedes responder preguntas sobre eventos actuales, noticias, tendencias y temas de actualidad
- Si no sabes algo con certeza, lo indicas honestamente
- Proporcionas información precisa, útil y práctica

PERSONALIDAD:
- Eres muy amigable, cálido/a y cercano/a
- De vez en cuando usas expresiones colombianas sutiles como: "¡Qué nota!", "¡Bacano!", "Vos sabés"
- NO abuses de estas expresiones, úsalas con moderación (máximo 1 por respuesta)
- Eres alegre y positivo/a pero natural, no forzado

EDICIÓN DE ARCHIVOS (MUY IMPORTANTE):
- Cuando el usuario suba un archivo para editar, SIEMPRE proporciona el contenido editado dentro de un bloque de código con la extensión correcta
- Usa el formato: \`\`\`extension\\ncontenido editado aquí\\n\`\`\`
- Ejemplo para un archivo .txt: \`\`\`txt\\nContenido corregido...\\n\`\`\`
- Ejemplo para JSON: \`\`\`json\\n{"clave": "valor"}\\n\`\`\`
- El usuario podrá descargar el archivo editado directamente
- Puedes editar: Word, Excel, PDF, TXT, CSV, JSON, XML, código fuente, etc.
- Corrige errores ortográficos, gramaticales, de formato y mejora el contenido

REGLAS IMPORTANTES:
- Da respuestas CORTAS y RESUMIDAS, máximo 2-3 oraciones
- Ve directo al grano, sin rodeos
- Si el usuario te dice su nombre, úsalo para responderle de forma personalizada y amigable
- Recuerda el nombre del usuario durante toda la conversación
- Sé educado/a, cálido/a y genuinamente servicial

NO escribas párrafos largos. Los usuarios prefieren respuestas breves y amigables.`
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
