import { Router } from 'express';
import dns from 'node:dns/promises';
import net from 'node:net';
import * as knowledgeService from '../services/knowledgeService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as urlScraperService from '../services/urlScraperService.js';

export const knowledgeRouter = Router();

const blockedHostnamePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/
];

const isPrivateIp = (ip: string) => {
    if (net.isIP(ip) === 4) {
        const [a, b] = ip.split('.').map(Number);
        if (a === 10) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 127) return true;
        if (a === 169 && b === 254) return true;
        return false;
    }

    if (net.isIP(ip) === 6) {
        return ip.startsWith('fd') || ip.startsWith('fc') || ip === '::1' || ip.startsWith('fe80');
    }

    return true;
};

const validateScrapeUrl = async (inputUrl: string) => {
    let parsedUrl: URL;

    try {
        parsedUrl = new URL(inputUrl);
    } catch {
        throw new Error('Invalid URL format');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS protocols are allowed');
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (blockedHostnamePatterns.some(pattern => pattern.test(hostname))) {
        throw new Error('Cannot scrape internal or private network addresses');
    }

    const resolvedAddresses = await dns.lookup(hostname, { all: true });
    if (!resolvedAddresses.length) {
        throw new Error('Unable to resolve target host');
    }

    if (resolvedAddresses.some(addressInfo => isPrivateIp(addressInfo.address))) {
        throw new Error('Resolved address points to a private network');
    }

    return parsedUrl.toString();
};

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

        let sanitizedUrl: string;
        try {
            sanitizedUrl = await validateScrapeUrl(url);
        } catch (validationError: any) {
            return res.status(400).json({
                success: false,
                message: validationError.message
            });
        }

        console.log(`🕷️ Scraping URL: ${sanitizedUrl}`);
        const result = await urlScraperService.scrapeUrl(sanitizedUrl);

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

