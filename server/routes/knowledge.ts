import { Router } from 'express';
import { storage } from '../utils/storage.js';

export const knowledgeRouter = Router();

knowledgeRouter.get('/', async (req, res) => {
    const kb = await storage.getKnowledgeBase();
    res.json(kb);
});

knowledgeRouter.post('/', async (req, res) => {
    const kb = await storage.getKnowledgeBase();
    const source = { ...req.body, id: Date.now().toString(), createdAt: Date.now() };
    kb.push(source);
    await storage.saveKnowledgeBase(kb);
    // TODO: Trigger embedding generation here
    res.json(source);
});

knowledgeRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let kb = await storage.getKnowledgeBase();
    kb = kb.filter((k: any) => k.id !== id);
    await storage.saveKnowledgeBase(kb);
    res.json({ success: true });
});

knowledgeRouter.post('/search', async (req, res) => {
    const { query } = req.body;
    const knowledgeBase = await storage.getKnowledgeBase();

    if (!query || knowledgeBase.length === 0) {
        return res.json([]);
    }

    // Simple keyword matching (case-insensitive)
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);

    if (keywords.length === 0) {
        return res.json([]);
    }

    const results = knowledgeBase.map((source: any) => {
        const content = (source.content || source.data || '').toLowerCase();
        const title = (source.title || '').toLowerCase();
        let score = 0;

        // Count keyword matches in content and title
        keywords.forEach((keyword: string) => {
            const contentMatches = (content.match(new RegExp(keyword, 'g')) || []).length;
            const titleMatches = (title.match(new RegExp(keyword, 'g')) || []).length;
            score += contentMatches + (titleMatches * 2); // Title matches weighted higher
        });

        return {
            source,
            similarity: score > 0 ? Math.min(score / keywords.length / 10, 1) : 0
        };
    })
        .filter((r: any) => r.similarity > 0)
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, 5);

    res.json(results);
});
