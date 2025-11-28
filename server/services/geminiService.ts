import { GoogleGenAI } from '@google/genai';

const DEFAULT_CHAT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

type Part = { text: string };
export type GeminiChatMessage = { role: string; parts: Part[] };

// Define interfaces for Gemini API responses to avoid 'any'
interface GeminiCandidate {
    content: {
        parts: Part[];
        role?: string;
    };
    finishReason?: string;
    citationMetadata?: any;
}

interface GeminiGenerateResponse {
    response?: {
        text: () => string;
        candidates?: GeminiCandidate[];
    };
    text?: string; // Some versions might return text directly
}

interface GeminiEmbedResponse {
    embedding?: {
        values: number[];
    };
    embeddings?: Array<{
        values: number[];
    }>;
}

const resolveApiKey = (): string | undefined => {
    return process.env.GEMINI_API_KEY;
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
                text: `Use the following pieces of context to answer the user's question.
If the context contains specific instructions or "Pro Tips", you MUST follow them.
If the answer is not in the context, say you don't know, but do not ignore the context if it is relevant.

Context:
${context?.trim() || 'No additional context provided.'}

Question: ${userQuery}`,
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
    }) as unknown as GeminiGenerateResponse; // Cast to our defined interface

    let responseText = '';

    // Handle various response structures safely
    if (result.response && typeof result.response.text === 'function') {
        try {
            responseText = result.response.text();
        } catch (e) {
            // text() might throw if blocked
            console.warn('Gemini response.text() failed, checking candidates');
        }
    }

    if (!responseText && result.text) {
        responseText = result.text;
    }

    if (!responseText && result.response?.candidates?.[0]?.content?.parts) {
        responseText = result.response.candidates[0].content.parts
            .map((part) => part.text || '')
            .join('\n');
    }

    const finalText = responseText.trim();
    if (!finalText) {
        throw new Error('Gemini returned an empty response');
    }
    return finalText;
};

/**
 * Generates a vector embedding for a given text using the Gemini API.
 * @param text The text to embed.
 * @returns A promise that resolves to a 768-dimension numerical vector.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
    const client = getGeminiClient();
    if (!client) {
        throw new Error("Gemini client not configured. Cannot generate embedding.");
    }

    try {
        const result = await client.models.embedContent({
            model: 'gemini-embedding-001',
            contents: [
                {
                    parts: [
                        {
                            text: text,
                        },
                    ],
                },
            ],
            config: {
                outputDimensionality: 768,
            },
        }) as unknown as GeminiEmbedResponse;

        const embedding = result.embedding?.values || result.embeddings?.[0]?.values;

        if (!embedding) {
            throw new Error('Gemini returned no embedding');
        }
        return embedding;
    } catch (error: any) {
        const status = error?.status || error?.code;
        const message = error?.message || error;
        const details = status ? `${status}: ${message}` : message;

        console.error('Failed to generate embedding:', details);
        throw error;
    }
};

/**
 * Generate streaming chat response using Gemini API
 * @param contents - Array of chat messages
 * @param systemInstruction - System prompt/instruction
 * @returns Async iterable stream of response chunks
 */
export const generateChatResponseStream = async (contents: GeminiChatMessage[], systemInstruction: string) => {
    const client = getGeminiClient();
    if (!client) {
        throw new Error('Gemini API not configured');
    }

    return client.models.generateContentStream({
        model: DEFAULT_CHAT_MODEL,
        contents,
        config: { systemInstruction }
    });
};
