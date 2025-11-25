import { Router } from 'express';
import * as knowledgeService from '../services/knowledgeService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as urlScraperService from '../services/urlScraperService.js';

export const knowledgeRouter = Router();

knowledgeRouter.get('/', async (req, res) => {
    const kb = await knowledgeService.getAll();
    res.json(kb);
});

knowledgeRouter.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('📥 Adding KB source:', req.body.type);
        const source = await knowledgeService.add(req.body);
        console.log('✅ SUCCESS: Added', source.type, 'source with ID:', source.id);
        res.json(source);
    } catch (error: any) {
        console.error('❌ FAILED: Could not add source -', error.message);
        res.status(500).json({ error: 'Failed to add source' });
    }
});

knowledgeRouter.post('/bulk', authMiddleware, async (req, res) => {
    try {
        const items = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Body must be an array of items' });
        }

        console.log(`📦 Bulk adding ${items.length} KB sources...`);
        const count = await knowledgeService.addBulk(items);
        console.log(`✅ SUCCESS: Added ${count} sources to knowledge base`);
        res.json({ success: true, count });
    } catch (error: any) {
        console.error('❌ FAILED: Bulk upload error -', error.message);
        res.status(500).json({ error: 'Bulk upload failed' });
    }
});

knowledgeRouter.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting KB source:', id);
        await knowledgeService.remove(id);
        console.log('✅ SUCCESS: Deleted source', id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('❌ FAILED: Could not delete source -', error.message);
        res.status(500).json({ error: 'Delete failed' });
    }
});

knowledgeRouter.post('/reindex', authMiddleware, async (req, res) => {
    try {
        console.log('🔄 Re-indexing knowledge base...');
        const count = await knowledgeService.reindex();
        console.log(`✅ SUCCESS: Re-indexed ${count} sources`);
        res.json({ success: true, count });
    } catch (error: any) {
        console.error('❌ FAILED: Re-index error -', error.message);
        res.status(500).json({ error: 'Reindex failed' });
    }
});

knowledgeRouter.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        const results = await knowledgeService.search(query);
        console.log(`🔍 Search for "${query}" returned ${results.length} results`);
        res.json(results);
    } catch (error: any) {
        console.error('❌ FAILED: Search error -', error.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

knowledgeRouter.post('/scrape', authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        console.log(`🕷️ Scraping URL: ${url}`);
        const result = await urlScraperService.scrapeUrl(url);

        if (result.success) {
            console.log(`✅ Scrape success: ${result.content?.length} chars`);
        } else {
            console.warn(`⚠️ Scrape failed: ${result.message}`);
        }

        res.json(result);
    } catch (error: any) {
        console.error('❌ Scrape error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to scrape URL'
        });
    }
});

