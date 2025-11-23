import { GoogleGenAI } from '@google/genai';

const DEFAULT_CHAT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

type Part = { text: string };
export type GeminiChatMessage = { role: string; parts: Part[] };

const resolveApiKey = (): string | undefined => {
    return process.env.API_KEY || process.env.GEMINI_API_KEY;
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

    const responseText =
        (typeof (result as any)?.response?.text === 'function' && (result as any).response.text()) ||
        (result as any)?.text ||
        (result as any)?.response?.candidates?.[0]?.content?.parts?.map((part: Part & { text?: string }) => part.text || '').join('\n') ||
        '';

    const finalText = responseText.trim();
    if (!finalText) {
        throw new Error('Gemini returned an empty response');
    }
    return finalText;
};

/**
 * Simulates generating a vector embedding for a given text.
 * In a real application, this would call an embedding model like 'text-embedding-004' on the server.
 * This function remains here to be called by the mock backend service.
 * @param text The text to embed.
 * @returns A promise that resolves to a 768-dimension numerical vector.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    const client = getGeminiClient();
    if (!client) {
        console.warn("Gemini client not configured. Returning simulated embedding.");
        return simulateEmbedding(text);
    }

    try {
        const result = await client.models.embedContent({
            model: 'text-embedding-004',
            contents: [
                {
                    parts: [
                        {
                            text: text,
                        },
                    ],
                },
            ],
        });

        const embedding = (result as any).embedding?.values || (result as any).embeddings?.[0]?.values;
        if (!embedding) {
            throw new Error('Gemini returned no embedding');
        }
        return embedding;
    } catch (error: any) {
        const status = (error as any)?.status || (error as any)?.code;
        const message = (error as any)?.message || error;
        const details = status ? `${status}: ${message}` : message;

        console.warn('Failed to generate real embedding, falling back to simulation:', details);

        if (typeof message === 'string' && message.includes('reported as leaked')) {
            console.warn(
                'Your Gemini API key was rejected as leaked or revoked. Generate a fresh key in Google AI Studio and update both .env.local and server/.env before retrying.',
            );
        }

        // Fallback to simulation if API fails or isn't configured
        return simulateEmbedding(text);
    }
};

const simulateEmbedding = (text: string): number[] => {
    // This simulates the behavior of an embedding model, producing a deterministic vector.
    // The text-embedding-004 model creates 768-dimension vectors.
    console.warn("Simulating embedding generation.");

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
