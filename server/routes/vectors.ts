import express from 'express';
import * as chromaService from '../services/chromaService.js';
import { KnowledgeSource } from '../types.js';

const router = express.Router();

// Query similar knowledge sources
router.post('/query', async (req, res) => {
    try {
        const { query, topK = 5 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const results = await chromaService.querySimilar(query, topK);
        res.json({ results });
    } catch (error) {
        console.error('[vectors/query] Error:', error);
        res.status(500).json({ error: 'Vector search failed' });
    }
});

// Upsert sources to ChromaDB
router.post('/upsert', async (req, res) => {
    try {
        const { sources } = req.body as { sources: KnowledgeSource[] };

        if (!sources || !Array.isArray(sources)) {
            return res.status(400).json({ error: 'Sources array is required' });
        }

        await chromaService.upsertSources(sources);
        res.json({ success: true, count: sources.length });
    } catch (error) {
        console.error('[vectors/upsert] Error:', error);
        res.status(500).json({ error: 'Upsert failed' });
    }
});

// Delete source from ChromaDB
router.post('/delete', async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Source ID is required' });
        }

        await chromaService.deleteSource(id);
        res.json({ success: true });
    } catch (error) {
        console.error('[vectors/delete] Error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Health check for ChromaDB connection
router.get('/health', async (req, res) => {
    try {
        // Simple health check - try to query with empty string
        await chromaService.querySimilar('test', 1);
        res.json({ status: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'disconnected', error: String(error) });
    }
});

export default router;
