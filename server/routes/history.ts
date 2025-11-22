import { Router } from 'express';

export const historyRouter = Router();

// In-memory storage: userId -> Message[]
const historyStore = new Map<string, any[]>();

historyRouter.get('/', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.json([]);
    res.json(historyStore.get(userId) || []);
});

historyRouter.post('/message', (req, res) => {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'Missing data' });

    const current = historyStore.get(userId) || [];
    current.push(message);
    historyStore.set(userId, current);

    res.json({ success: true });
});

historyRouter.put('/', (req, res) => {
    const { userId, messages } = req.body;
    if (!userId || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid data' });

    historyStore.set(userId, messages);
    res.json({ success: true });
});

historyRouter.delete('/', (req, res) => {
    const userId = req.query.userId as string;
    if (userId) historyStore.delete(userId);
    res.json({ success: true });
});
