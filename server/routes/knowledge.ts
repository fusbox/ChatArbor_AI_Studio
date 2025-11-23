import { Router } from 'express';
import { storage } from '../utils/storage.js';
import * as chromaService from '../services/chromaService.js';

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

    try {
        await chromaService.upsertSources([source]);
    } catch (error) {
        console.error('Failed to upsert to Chroma:', error);
    }

    res.json(source);
});

knowledgeRouter.post('/bulk', async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Body must be an array of items' });
        }

        const kb = await storage.getKnowledgeBase();
        const newItems = items.map((item, index) => ({
            ...item,
            id: item.id || `${Date.now()}-${index}`,
            createdAt: Date.now()
        }));

        // Upsert to ChromaDB and get embeddings
        try {
            const embeddings = await chromaService.upsertSources(newItems);

            // Update items with embeddings and save again
            const itemsWithEmbeddings = newItems.map((item, index) => ({
                ...item,
                embedding: embeddings[index]
            }));

            // Replace the items in the KB with the ones that have embeddings
            // Note: We just appended them, so we can slice and replace, or just map over the whole KB
            // But since we just appended, let's just update the last N items? 
            // Safer to just reconstruct the array.

            const finalKb = [...kb, ...itemsWithEmbeddings];
            await storage.saveKnowledgeBase(finalKb);

        } catch (error) {
            console.error('Failed to bulk upsert to Chroma:', error);
            // We don't fail the request if vector DB fails, but we log it
            // And we still save the items without embeddings (already done above? No, wait.)

            // If upsert fails, we should still save the items without embeddings
            const finalKb = [...kb, ...newItems];
            await storage.saveKnowledgeBase(finalKb);
        }

        res.json({ success: true, count: newItems.length });
    } catch (error) {
        console.error('Bulk upload failed:', error);
        res.status(500).json({ error: 'Bulk upload failed' });
    }
});

knowledgeRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let kb = await storage.getKnowledgeBase();
    kb = kb.filter((k: any) => k.id !== id);
    await storage.saveKnowledgeBase(kb);
    res.json({ success: true });
});

knowledgeRouter.post('/reindex', async (req, res) => {
    try {
        const kb = await storage.getKnowledgeBase();
        if (kb.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        // Upsert all sources to Chroma in batches
        const BATCH_SIZE = 5;
        const embeddings: number[][] = [];

        for (let i = 0; i < kb.length; i += BATCH_SIZE) {
            const batch = kb.slice(i, i + BATCH_SIZE);
            const batchEmbeddings = await chromaService.upsertSources(batch);
            embeddings.push(...batchEmbeddings);
        }

        // Update KB with embeddings
        const updatedKb = kb.map((item: any, index: number) => ({
            ...item,
            embedding: embeddings[index]
        }));

        await storage.saveKnowledgeBase(updatedKb);

        res.json({ success: true, count: kb.length });
    } catch (error) {
        console.error('Reindex failed:', error);
        res.status(500).json({ error: 'Reindex failed' });
    }
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
