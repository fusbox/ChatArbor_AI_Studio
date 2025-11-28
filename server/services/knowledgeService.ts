import { storage } from '../utils/storage.js';
import * as chromaService from './chromaService.js';
import { KnowledgeSource } from '../types.js';
import { splitText } from '../utils/textSplitter.js';

export const getAll = async () => {
    return storage.getKnowledgeBase();
};

const prepareChunks = (source: any) => {
    // Prioritize 'data' (scraped content) over 'content' (URL/filename) for URL/File types
    // For TEXT type, 'data' is undefined so it falls back to 'content'
    const content = source.data || source.content || '';
    const chunks = splitText(content, { chunkSize: 1000, chunkOverlap: 200 });

    return chunks.map((chunk, index) => ({
        id: `${source.id}-chunk-${index}`,
        content: chunk,
        type: source.type,
        createdAt: source.createdAt,
        metadata: {
            sourceId: source.id,
            chunkIndex: index,
            totalChunks: chunks.length,
            title: source.title,
            type: source.type
        }
    }));
};

export const add = async (data: any) => {
    const source = { ...data, id: Date.now().toString(), createdAt: Date.now() };

    try {
        // Chunk the content
        const chunks = prepareChunks(source);

        // Upsert chunks to ChromaDB (using a modified upsert that handles chunks)
        // We need to adapt chromaService to accept our chunk format or map it here
        // Mapping chunks to KnowledgeSource-like objects for chromaService
        const chunkSources = chunks.map(c => ({
            id: c.id,
            content: c.content,
            type: c.type,
            createdAt: c.createdAt,
            // We'll need to ensure chromaService handles metadata correctly
            // For now, we pass the chunk content as the 'data'
            data: c.content
        }));

        await chromaService.upsertSources(chunkSources as any[]);

        // We don't store embedding on the main source object anymore since it's chunked
        source.chunkCount = chunks.length;

    } catch (error) {
        console.error('Failed to generate embedding or upsert to Chroma:', error);
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

    try {
        let allChunks: any[] = [];

        for (const item of newItems) {
            const chunks = prepareChunks(item);
            const chunkSources = chunks.map(c => ({
                id: c.id,
                content: c.content,
                type: c.type,
                createdAt: c.createdAt,
                data: c.content
            }));
            allChunks = [...allChunks, ...chunkSources];
            item.chunkCount = chunks.length;
        }

        // Upsert all chunks to Chroma
        // Process in batches of 50 to avoid hitting limits
        const BATCH_SIZE = 50;
        for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
            const batch = allChunks.slice(i, i + BATCH_SIZE);
            await chromaService.upsertSources(batch);
        }

        await storage.addKnowledgeSources(newItems);

    } catch (error) {
        console.error('Failed to bulk upsert to Chroma:', error);
        await storage.addKnowledgeSources(newItems);
    }

    return newItems.length;
};

export const remove = async (id: string) => {
    await storage.deleteKnowledgeSource(id);

    try {
        // We need to delete all chunks for this source
        // Since we don't track chunk IDs easily, we might need to query by metadata
        // OR, if we know the ID pattern, we can try to delete.
        // Chroma delete by metadata is supported in newer versions, but let's stick to ID if possible.
        // Ideally, we should query Chroma for all IDs where metadata.sourceId == id
        // For now, we'll try to delete the source ID itself (legacy) and maybe we need a way to delete chunks.
        // LIMITATION: chromaService.deleteSource only takes an ID.
        // We might need to extend chromaService to delete by metadata or we just accept orphans for now.
        // TODO: Implement delete by metadata in chromaService
        console.warn('Deleting chunks not fully implemented yet - orphans may remain');
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

    // Reset collection to handle potential embedding dimension changes
    console.log('Resetting Chroma collection...');
    await chromaService.resetCollection();

    let allChunks: any[] = [];

    for (const item of kb) {
        console.log(`[Reindex] Processing item ${item.id}: Type=${item.type}, ContentLength=${(item.content || item.data || '').length}`);
        const chunks = prepareChunks(item);
        console.log(`[Reindex] Generated ${chunks.length} chunks for item ${item.id}`);

        const chunkSources = chunks.map(c => ({
            id: c.id,
            content: c.content,
            type: c.type,
            createdAt: c.createdAt,
            data: c.content
        }));
        allChunks = [...allChunks, ...chunkSources];
    }

    // Upsert all chunks
    const BATCH_SIZE = 20;
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
        const batch = allChunks.slice(i, i + BATCH_SIZE);
        await chromaService.upsertSources(batch);
        console.log(`Re-indexed chunks ${i} to ${Math.min(i + BATCH_SIZE, allChunks.length)}`);
    }

    return kb.length;
};

export const search = async (query: string) => {
    if (!query) return [];

    try {
        // Use vector search
        const results = await chromaService.querySimilar(query, 5);

        // Map results back to a useful format
        // We need to fetch the full source context if needed, or just return the chunk
        // The UI expects { source, similarity }

        // Since we are returning chunks, the "source" object will be the chunk content
        // We might want to look up the parent source title from storage if possible,
        // but for now let's construct a source-like object from the chunk ID and content.

        return results.map(r => {
            // Parse ID to get metadata if possible, or just return as is
            // id format: sourceId-chunk-index
            const parts = r.id.split('-chunk-');
            const sourceId = parts[0];

            return {
                source: {
                    id: r.id,
                    content: r.document, // chromaService querySimilar needs to return documents too
                    type: 'chunk',
                    originalSourceId: sourceId,
                    createdAt: r.metadata?.createdAt || Date.now() // Fallback to now if missing
                },
                similarity: chromaService.distanceToCosineSimilarity(r.distance)
            };
        });

    } catch (error) {
        console.error('Vector search failed:', error);
        return [];
    }
};
