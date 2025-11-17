import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.15.0";

serve(async (req) => {
  const { query, history } = await req.json()
  const apiKey = Deno.env.get("API_KEY");
  if (!apiKey) {
    return new Response("API_KEY not set", { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

  const chat = model.startChat({
    history: history,
    generationConfig: {
      maxOutputTokens: 100,
    },
  });

  const result = await chat.sendMessage(query);
  const response = await result.response;
  const text = response.text();

  return new Response(text, {
    headers: { "Content-Type": "text/plain" },
  })
})
