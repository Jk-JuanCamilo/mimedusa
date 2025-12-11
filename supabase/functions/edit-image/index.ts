import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_PROMPT_LENGTH = 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt, imageData, userId } = body;

    console.log("edit-image: Request received, userId:", userId || "anonymous");

    // Validate inputs
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Se requiere una instrucción de edición" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!imageData || typeof imageData !== "string") {
      return new Response(JSON.stringify({ error: "Se requiere una imagen" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ error: `La instrucción es muy larga. Máximo ${MAX_PROMPT_LENGTH} caracteres.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit for authenticated users only
    if (userId) {
      const { data: canEdit, error: rateLimitError } = await supabase.rpc(
        "check_image_edit_rate_limit",
        { p_user_id: userId }
      );

      if (rateLimitError) {
        console.error("Rate limit check error:", rateLimitError);
      }

      if (canEdit === false) {
        console.log("Rate limit exceeded for userId:", userId);
        return new Response(JSON.stringify({ 
          error: "Has alcanzado el límite de 3 ediciones por hora. Por favor espera antes de intentar de nuevo." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("edit-image: Calling AI API with prompt:", prompt.substring(0, 50) + "...");

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
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
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
      
      return new Response(JSON.stringify({ error: "Error al editar la imagen. Por favor intenta de nuevo." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("edit-image: AI response received");
    
    const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "¡Imagen editada!";

    if (!editedImageUrl) {
      console.log("No edited image returned, text response:", textContent);
      return new Response(JSON.stringify({ 
        text: textContent || "No se pudo editar la imagen. Por favor intenta con instrucciones más específicas."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record usage (only user_id, no IP)
    const { error: insertError } = await supabase
      .from("image_edit_usage")
      .insert({ user_id: userId || null });

    if (insertError) {
      console.error("Failed to record usage:", insertError);
    }

    console.log("edit-image: Success, image edited");

    return new Response(JSON.stringify({ 
      imageUrl: editedImageUrl,
      text: textContent
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Image edit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
