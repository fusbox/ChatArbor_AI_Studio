import { Router } from 'express';
import { storage } from '../utils/storage.js';

export const feedbackRouter = Router();

feedbackRouter.post('/', async (req, res) => {
    const feedbackItem = { ...req.body, id: Date.now().toString(), submittedAt: Date.now() };
    const feedback = await storage.getFeedback();
    feedback.push(feedbackItem);
    await storage.saveFeedback(feedback);
    res.json({ success: true });
});
