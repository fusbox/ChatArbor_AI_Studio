import { Router } from 'express';
import * as geminiService from '../services/geminiService.js';
import * as storage from '../utils/storage.js';

export const chatStreamRouter = Router();

chatStreamRouter.post('/', async (req, res) => {
    try {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        const { message, history = [] } = req.body;

        // Get system prompt from settings
        const settings = await storage.getSettings();
        const systemPrompt = settings.systemPrompt || 'You are a helpful assistant.';

        // Build chat history in Gemini format - ensure valid structure
        const geminiHistory: geminiService.GeminiChatMessage[] = history
            .filter((msg: any) => msg.role && msg.parts && Array.isArray(msg.parts))
            .map((msg: any) => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: msg.parts.filter((part: any) => part.text) // Ensure parts have text
            }))
            .filter((msg: any) => msg.parts.length > 0); // Remove empty messages

        // Add current user message
        geminiHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Get streaming response
        const stream = await geminiService.generateChatResponseStream(geminiHistory, systemPrompt);

        let fullText = '';
        let usageMetadata: any = null;

        // Stream chunks to client
        for await (const chunk of stream) {
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            fullText += text;

            // Send chunk via SSE
            if (text) {
                res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
            }

            // Capture usage metadata from final chunk
            if (chunk.usageMetadata) {
                usageMetadata = chunk.usageMetadata;
            }
        }

        // Send final message with usage metadata
        console.log(`📊 Stream completed | Tokens: prompt=${usageMetadata?.promptTokenCount || 0}, response=${usageMetadata?.candidatesTokenCount || 0}, total=${usageMetadata?.totalTokenCount || 0}`);

        res.write(`data: ${JSON.stringify({
            done: true,
            usageMetadata: usageMetadata || {}
        })}\n\n`);

        res.end();

    } catch (error: any) {
        console.error('❌ Streaming error:', error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});
