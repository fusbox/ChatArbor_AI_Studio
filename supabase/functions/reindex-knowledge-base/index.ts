import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@^2.44.4'
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.15.0";

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const apiKey = Deno.env.get("API_KEY");
  if (!apiKey) {
    return new Response("API_KEY not set", { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

  const { data: sources, error } = await supabase
    .from("knowledge_sources")
    .select("id, content, type");

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  let count = 0;
  for (const source of sources) {
    let contentToEmbed = source.content;
    if (source.type === 'file') {
      // In a real application, you would use a library to parse the file content.
      // For this example, we'll assume the file is a plain text file and the content is the URL.
      const response = await fetch(source.content);
      contentToEmbed = await response.text();
    }

    const embedding = await model.embedContent(contentToEmbed);
    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert({
        knowledge_source_id: source.id,
        content: contentToEmbed,
        embedding: embedding.embedding.values,
      });

    if (insertError) {
      console.error(`Failed to insert chunk for source ${source.id}:`, insertError);
    } else {
      count++;
    }
  }

  return new Response(JSON.stringify({ count }), {
    headers: { "Content-Type": "application/json" },
  });
})
