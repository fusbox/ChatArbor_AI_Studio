import { GoogleGenAI } from '@google/genai';

const DEFAULT_CHAT_MODEL = (import.meta as any).env?.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

type Part = { text: string };
export type GeminiChatMessage = { role: string; parts: Part[] };

const resolveApiKey = (): string | undefined => {
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const processEnv = typeof process !== 'undefined' ? (process.env?.API_KEY || process.env?.GEMINI_API_KEY) : undefined;
    return viteKey || processEnv;
};

let cachedClient: GoogleGenAI | null | undefined = undefined;

const getGeminiClient = (): GoogleGenAI | null => {
    if (cachedClient !== undefined) {
        return cachedClient;
    }
    const apiKey = resolveApiKey();
    if (!apiKey) {
        cachedClient = null;
        return null;
    }
    cachedClient = new GoogleGenAI({ apiKey });
    return cachedClient;
};

export const isGeminiConfigured = (): boolean => Boolean(getGeminiClient());

export interface GeminiChatRequest {
    userQuery: string;
    chatHistory: GeminiChatMessage[];
    context: string;
    systemPrompt?: string;
}

export const generateChatResponse = async ({
    userQuery,
    chatHistory,
    context,
    systemPrompt,
}: GeminiChatRequest): Promise<string> => {
    const client = getGeminiClient();
    if (!client) {
        throw new Error('Gemini client not configured');
    }

    const trimmedPrompt = systemPrompt?.trim();
    const contextualTurn: GeminiChatMessage = {
        role: 'user',
        parts: [
            {
                text: `Context:\n${context?.trim() || 'No additional context provided.'}\n\nQuestion: ${userQuery}`,
            },
        ],
    };

    // Replace the latest user turn with our contextualized prompt to avoid duplicate turns.
    const historyWithoutLatest = chatHistory.slice(0, Math.max(chatHistory.length - 1, 0));
    const contents = [...historyWithoutLatest, contextualTurn];

    const result = await client.models.generateContent({
        model: DEFAULT_CHAT_MODEL,
        contents,
        config: trimmedPrompt ? { systemInstruction: trimmedPrompt } : undefined,
    });

    // Extract the generated text from the Gemini response
    const responseText = result?.candidates?.[0]?.content?.parts?.map((part: Part) => part.text ?? '').join('\n') ?? '';
    const finalText = responseText.trim();
    if (!finalText) {
        throw new Error('Gemini returned an empty response');
    }
    return finalText;
}

/**
 * Simulates generating a vector embedding for a given text.
 * In a real application, this would call an embedding model like 'text-embedding-004' on the server.
 * This function remains here to be called by the mock backend service.
 * @param text The text to embed.
 * @returns A promise that resolves to a 768-dimension numerical vector.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    // This simulates the behavior of an embedding model, producing a deterministic vector.
    // The text-embedding-004 model creates 768-dimension vectors.
    console.warn("Simulating embedding generation. This would happen on a server in production.");

    // Create a pseudo-random but deterministic vector based on the text.
    // This provides consistency for the same input text.
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
        seed = (seed + text.charCodeAt(i) * (i + 1)) % 1000000;
    }

    let a = seed;
    const random = () => {
        a = (a * 9301 + 49297) % 233280;
        return a / 233280;
    };

    const vector = Array(768).fill(0).map(() => random() * 2 - 1);

    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(v => v / magnitude);
};
