import { Router } from 'express';
import { storage } from '../utils/storage.js';

export const feedbackRouter = Router();

feedbackRouter.post('/', async (req, res) => {
    const feedbackItem = { ...req.body, id: Date.now().toString(), submittedAt: Date.now() };
    await storage.addFeedback(feedbackItem);
    res.json({ success: true });
});
