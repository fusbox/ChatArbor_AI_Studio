import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

export const chatRouter = Router();

// Initialize Gemini Client
// In production, ensure GEMINI_API_KEY is set in .env
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

chatRouter.post('/', async (req, res) => {
    try {
        const { userQuery, chatHistory, context, systemPrompt } = req.body;

        if (!client) {
            return res.status(503).json({
                error: 'Gemini API key not configured on server.',
                fallback: true
            });
        }

        // Construct the prompt
        const contextualTurn = {
            role: 'user',
            parts: [{ text: `Context:\n${context?.trim() || 'No additional context provided.'}\n\nQuestion: ${userQuery}` }]
        };

        const historyWithoutLatest = chatHistory.slice(0, Math.max(chatHistory.length - 1, 0));
        const contents = [...historyWithoutLatest, contextualTurn];

        const result = await client.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
            contents,
            config: systemPrompt?.trim() ? { systemInstruction: systemPrompt.trim() } : undefined,
        });

        // Extract text with multiple fallbacks
        const resultAny = result as any;
        let responseText = '';

        if (typeof resultAny?.response?.text === 'function') {
            responseText = resultAny.response.text();
        } else if (resultAny?.text) {
            responseText = resultAny.text;
        } else if (resultAny?.response?.candidates?.[0]?.content?.parts) {
            responseText = resultAny.response.candidates[0].content.parts
                .map((part: any) => part.text || '')
                .join('\n');
        }

        if (!responseText) {
            console.error('Unexpected Gemini response structure:', JSON.stringify(result, null, 2));
            throw new Error('Failed to extract response text from Gemini');
        }


        res.json({ response: responseText });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});
