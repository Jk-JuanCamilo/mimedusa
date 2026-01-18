import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, firebaseUid, interests, topicsCount, lastTopics } = await req.json();

    if (!firebaseUid) {
      return new Response(
        JSON.stringify({ error: "Firebase UID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case "get": {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", firebaseUid)
          .maybeSingle();

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        // Check if exists
        const { data: existing } = await supabase
          .from("user_preferences")
          .select("id")
          .eq("user_id", firebaseUid)
          .maybeSingle();

        const updateData = {
          interests: interests || [],
          topics_count: topicsCount || {},
          last_topics: lastTopics || []
        };

        if (existing) {
          const { error } = await supabase
            .from("user_preferences")
            .update(updateData)
            .eq("user_id", firebaseUid);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_preferences")
            .insert({
              user_id: firebaseUid,
              ...updateData,
              preferred_language: "es"
            });

          if (error) throw error;
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Preferences error:", error);
    const message = error instanceof Error ? error.message : "Operation failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
