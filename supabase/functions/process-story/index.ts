import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { storyId } = await req.json();

    if (!storyId) {
      return new Response(
        JSON.stringify({ error: "storyId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Stub: AI processing logic (transcript, translation, summary) will be added here later.
    // For now, just acknowledge the request and mark the story as received.

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: story, error: fetchError } = await supabase
      .from("stories")
      .select("id, title, audio_url, video_url")
      .eq("id", storyId)
      .maybeSingle();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch story" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!story) {
      return new Response(
        JSON.stringify({ error: "Story not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        message: "Story received. AI processing is not yet implemented — this is a stub endpoint.",
        storyId: story.id,
        title: story.title,
        hasMedia: !!(story.audio_url || story.video_url),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
