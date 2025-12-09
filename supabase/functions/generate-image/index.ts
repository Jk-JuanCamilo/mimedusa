import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PROMPT_LENGTH = 2000; // Max characters for image prompt
const MIN_PROMPT_LENGTH = 3; // Minimum characters for meaningful prompt

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate request body structure
    if (!body || typeof body !== "object") {
      console.error("Invalid request body");
      return new Response(JSON.stringify({ error: "Solicitud inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt } = body;

    // Validate prompt exists and is a string
    if (typeof prompt !== "string") {
      console.error("Prompt is not a string:", typeof prompt);
      return new Response(JSON.stringify({ error: "La descripción debe ser texto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate prompt length
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < MIN_PROMPT_LENGTH) {
      console.error("Prompt too short:", trimmedPrompt.length);
      return new Response(JSON.stringify({ error: "La descripción es muy corta. Describe qué imagen quieres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      console.error("Prompt too long:", trimmedPrompt.length);
      return new Response(JSON.stringify({ error: `La descripción es muy larga. Máximo ${MAX_PROMPT_LENGTH} caracteres.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Enhanced prompt for better image generation
    const enhancedPrompt = `Generate a high-quality, detailed image based on this description: ${trimmedPrompt}. 
    Create a visually appealing and creative image that matches the request. 
    Focus on quality, detail, and artistic value.`;

    console.log("Generating image with prompt:", trimmedPrompt.substring(0, 100) + "...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta más tarde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requieren créditos adicionales." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Error al generar la imagen. Por favor intenta de nuevo." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Image generation response received");
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "¡Aquí está tu imagen!";

    if (!imageUrl) {
      console.log("No image generated, returning text response:", textContent);
      // Return the AI's text response instead of an error - it likely needs more details
      return new Response(JSON.stringify({ 
        text: textContent || "Por favor proporciona una descripción más detallada de la imagen que deseas generar."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      imageUrl,
      text: textContent
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Image generation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
