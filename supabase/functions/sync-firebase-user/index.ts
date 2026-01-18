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
    const { firebaseUid, email, displayName } = await req.json();

    if (!firebaseUid) {
      return new Response(
        JSON.stringify({ error: "Firebase UID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Syncing Firebase user:", firebaseUid, email);

    // Check if user preferences exist, if not create them
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", firebaseUid)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: firebaseUid,
          interests: [],
          topics_count: {},
          last_topics: [],
          preferred_language: "es"
        });

      if (insertError) {
        console.error("Error creating user preferences:", insertError);
      } else {
        console.log("Created user preferences for:", firebaseUid);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to sync user" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
