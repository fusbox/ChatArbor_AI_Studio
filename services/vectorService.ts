// Vector API client for backend ChromaDB operations
// Replaces direct browser access to ChromaDB

import { KnowledgeSource } from '../types.js';

const API_BASE = '/api/vectors';

interface VectorQueryResult {
    results: { id: string; distance?: number }[];
}

/**
 * Query similar knowledge sources using vector search
 * @param query - Search query text
 * @param topK - Number of results to return
 */
export async function querySimilarSources(
    query: string,
    topK: number = 5
): Promise<{ id: string; distance?: number }[]> {
    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, topK }),
        });

        if (!response.ok) {
            throw new Error(`Vector query failed: ${response.status}`);
        }

        const data: VectorQueryResult = await response.json();
        return data.results;
    } catch (error) {
        console.error('[vectorService] Query failed:', error);
        return []; // Graceful fallback
    }
}

/**
 * Upsert knowledge sources to vector database
 * @param sources - Array of knowledge sources to upsert
 */
export async function upsertSources(sources: KnowledgeSource[]): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sources }),
        });

        if (!response.ok) {
            throw new Error(`Vector upsert failed: ${response.status}`);
        }

        console.log(`[vectorService] Upserted ${sources.length} sources`);
    } catch (error) {
        console.error('[vectorService] Upsert failed:', error);
        throw error; // Re-throw for error handling
    }
}

/**
 * Delete knowledge source from vector database
 * @param id - Source ID to delete
 */
export async function deleteSource(id: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });

        if (!response.ok) {
            throw new Error(`Vector delete failed: ${response.status}`);
        }

        console.log(`[vectorService] Deleted source: ${id}`);
    } catch (error) {
        console.error('[vectorService] Delete failed:', error);
        throw error;
    }
}

/**
 * Check ChromaDB health via backend
 */
export async function checkVectorHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
        });

        return response.ok;
    } catch (error) {
        console.error('[vectorService] Health check failed:', error);
        return false;
    }
}
