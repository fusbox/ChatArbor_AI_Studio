import { storage } from '../utils/storage.js';
import * as chromaService from './chromaService.js';
import { KnowledgeSource } from '../types.js';

export const getAll = async () => {
    return storage.getKnowledgeBase();
};

export const add = async (data: any) => {
    const source = { ...data, id: Date.now().toString(), createdAt: Date.now() };

    try {
        // Generate embedding via ChromaDB
        const embeddings = await chromaService.upsertSources([source]);
        // Store the embedding in the source
        if (embeddings && embeddings.length > 0) {
            source.embedding = embeddings[0];
        }
    } catch (error) {
        console.error('Failed to generate embedding or upsert to Chroma:', error);
        // Continue without embedding - user can re-index later
    }

    await storage.addKnowledgeSource(source);

    return source;
};

export const addBulk = async (items: any[]) => {
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

        await storage.addKnowledgeSources(itemsWithEmbeddings);

    } catch (error) {
        console.error('Failed to bulk upsert to Chroma:', error);
        // If upsert fails, we should still save the items without embeddings
        await storage.addKnowledgeSources(newItems);
    }

    return newItems.length;
};

export const remove = async (id: string) => {
    await storage.deleteKnowledgeSource(id);

    try {
        await chromaService.deleteSource(id);
    } catch (error) {
        console.error('Failed to delete from Chroma:', error);
    }
};

export const reindex = async () => {
    const kb = await storage.getKnowledgeBase();
    if (kb.length === 0) {
        return 0;
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
    return kb.length;
};

export const search = async (query: string) => {
    const knowledgeBase = await storage.getKnowledgeBase();

    if (!query || knowledgeBase.length === 0) {
        return [];
    }

    // Simple keyword matching (case-insensitive)
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);

    if (keywords.length === 0) {
        return [];
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

    return results;
};
