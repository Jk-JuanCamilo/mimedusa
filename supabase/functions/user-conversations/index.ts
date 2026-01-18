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
    const { action, firebaseUid, conversationId, title, role, content, imageUrl } = await req.json();

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
      case "list": {
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", firebaseUid)
          .order("updated_at", { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: firebaseUid, title: title || "Nueva conversación" })
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!conversationId) {
          return new Response(
            JSON.stringify({ error: "Conversation ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership
        const { data: conv } = await supabase
          .from("conversations")
          .select("user_id")
          .eq("id", conversationId)
          .single();

        if (conv?.user_id !== firebaseUid) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("conversations")
          .delete()
          .eq("id", conversationId);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deleteAll": {
        const { error } = await supabase
          .from("conversations")
          .delete()
          .eq("user_id", firebaseUid);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "getMessages": {
        if (!conversationId) {
          return new Response(
            JSON.stringify({ error: "Conversation ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership
        const { data: conv } = await supabase
          .from("conversations")
          .select("user_id")
          .eq("id", conversationId)
          .single();

        if (conv?.user_id !== firebaseUid) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "saveMessage": {
        if (!conversationId || !role || !content) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership
        const { data: conv } = await supabase
          .from("conversations")
          .select("user_id")
          .eq("id", conversationId)
          .single();

        if (conv?.user_id !== firebaseUid) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: msgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role,
            content,
            image_url: imageUrl || null
          });

        if (msgError) throw msgError;

        // Update conversation title and timestamp if user message
        if (role === "user") {
          const newTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          await supabase
            .from("conversations")
            .update({ title: newTitle, updated_at: new Date().toISOString() })
            .eq("id", conversationId);
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
    console.error("Conversation error:", error);
    const message = error instanceof Error ? error.message : "Operation failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
