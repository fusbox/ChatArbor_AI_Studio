import { Router } from 'express';
import { storage } from '../utils/storage.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const adminRouter = Router();

// Apply auth middleware to ALL admin routes
adminRouter.use(authMiddleware);

// System Prompt
adminRouter.get('/system-prompt', async (req, res) => {
    const settings = await storage.getSettings();
    res.json({ prompt: settings.systemPrompt });
});

adminRouter.post('/system-prompt', async (req, res) => {
    await storage.saveSettings({ systemPrompt: req.body.prompt });
    res.json({ success: true });
});

// Greetings
adminRouter.get('/greetings', async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings.greetings);
});

adminRouter.post('/greetings', async (req, res) => {
    await storage.saveSettings({ greetings: req.body.greetings });
    res.json({ success: true });
});

adminRouter.get('/greetings/active', async (req, res) => {
    const settings = await storage.getSettings();
    const active = settings.greetings.find((g: any) => g.isActive);
    res.json({ greeting: active ? active.text : 'Hello!' });
});

// Logs
adminRouter.get('/logs', async (req, res) => {
    const logs = await storage.getChatLogs();
    res.json(logs);
});

adminRouter.post('/logs', async (req, res) => {
    const { userId, messages } = req.body;
    await storage.addChatLog({ id: Date.now().toString(), userId, messages, timestamp: Date.now() });
    res.json({ success: true });
});

// Feedback (Admin View)
adminRouter.get('/feedback', async (req, res) => {
    const feedback = await storage.getFeedback();
    res.json(feedback);
});
