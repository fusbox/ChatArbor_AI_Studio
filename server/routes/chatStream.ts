import { Router } from 'express';
import * as geminiService from '../services/geminiService.js';
import * as storage from '../utils/storage.js';
import * as knowledgeService from '../services/knowledgeService.js';

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

        // --- RAG: Retrieve Context ---
        console.log(`🔍 Tracing: Searching knowledge base for "${message}"...`);
        const searchResults = await knowledgeService.search(message);

        let context = '';
        if (searchResults.length > 0) {
            console.log(`📄 Tracing: Found ${searchResults.length} relevant chunks.`);
            context = searchResults.map((r, i) => {
                const content = r.source.content || '';
                console.log(`   - Chunk ${i + 1} (Similarity: ${(r.similarity * 100).toFixed(1)}%): ${content.substring(0, 50)}...`);
                return `Source ${i + 1} (${r.source.type}):\n${content}`;
            }).join('\n\n');
        } else {
            console.log('⚠️ Tracing: No relevant knowledge found.');
        }

        // Get streaming response with context
        const stream = await geminiService.generateChatResponseStream(geminiHistory, systemPrompt, context);

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
