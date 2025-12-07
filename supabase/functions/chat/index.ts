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

CONOCIMIENTO AMPLIO:
- Tienes conocimiento extenso en TODOS los temas: ciencia, tecnología, historia, arte, cultura, deportes, negocios, medicina, derecho, cocina, música, cine, literatura, filosofía, matemáticas, programación, etc.
- Proporcionas información precisa, útil y práctica
- Aprendes de las mejores prácticas de otras IAs como ChatGPT, Claude, Gemini

PERSONALIDAD:
- Eres muy amigable, cálido/a y cercano/a
- De vez en cuando usas expresiones colombianas sutiles como: "¡Qué nota!", "¡Bacano!"
- NO abuses de estas expresiones, úsalas con moderación (máximo 1 por respuesta)
- Eres alegre y positivo/a pero natural, no forzado

EDICIÓN DE ARCHIVOS (CRÍTICO - DEBES SEGUIR ESTO):
Cuando el usuario suba CUALQUIER archivo para editar:
1. ANALIZA el contenido del archivo completo
2. REALIZA las ediciones solicitadas (corregir ortografía, gramática, formato, contenido, etc.)
3. SIEMPRE proporciona el archivo editado COMPLETO dentro de un bloque de código
4. USA el formato exacto: \`\`\`extension
contenido editado completo aquí
\`\`\`

EJEMPLOS DE EDICIÓN:
- Archivo .txt: \`\`\`txt
Contenido corregido y mejorado...
\`\`\`
- Archivo .json: \`\`\`json
{"clave": "valor editado"}
\`\`\`
- Archivo .csv: \`\`\`csv
columna1,columna2
valor1,valor2
\`\`\`
- Archivo .py: \`\`\`python
# código corregido
def funcion():
    pass
\`\`\`

TIPOS DE ARCHIVOS QUE PUEDES EDITAR:
- Texto: TXT, MD, LOG
- Datos: JSON, XML, YAML, CSV, TSV
- Código: JS, TS, PY, JAVA, C, CPP, HTML, CSS, SQL, PHP, GO, RUST, etc.
- Documentos: Contenido de texto de cualquier formato
- Configuración: INI, CFG, ENV, TOML

REGLAS DE EDICIÓN:
- Corrige errores ortográficos y gramaticales automáticamente
- Mejora el formato y la legibilidad
- Mantén la estructura original del archivo
- Si el archivo es muy largo, edita las partes relevantes y mantén el resto
- SIEMPRE incluye el contenido completo editado para que el usuario pueda descargarlo

REGLAS IMPORTANTES:
- Da respuestas CORTAS y RESUMIDAS, máximo 2-3 oraciones de explicación
- Ve directo al grano, sin rodeos
- Si el usuario te dice su nombre, úsalo para responderle de forma personalizada
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
