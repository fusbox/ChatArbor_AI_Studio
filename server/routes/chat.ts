import { Router } from 'express';
import * as chatService from '../services/chatService.js';
import { isGeminiConfigured } from '../services/geminiService.js';

export const chatRouter = Router();

chatRouter.post('/', async (req, res) => {
    try {
        const { userQuery, chatHistory, context, systemPrompt } = req.body;

        if (!isGeminiConfigured()) {
            return res.status(503).json({
                error: 'Gemini API key not configured on server.',
                fallback: true
            });
        }

        const responseText = await chatService.generateResponse({
            userQuery,
            chatHistory,
            context,
            systemPrompt
        });

        res.json({ response: responseText });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to generate response', details: error.message });
    }
});

