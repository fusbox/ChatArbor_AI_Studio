import { KnowledgeSource } from '../types.js';
import { generateEmbedding } from './geminiService.js';

// Lightweight Chroma HTTP client for browser use
// Expects a Chroma server running with HTTP API enabled
// Configure via Vite envs:
// - VITE_CHROMA_URL (default http://localhost:8000)
// - VITE_CHROMA_COLLECTION (default 'knowledge_sources')
// - VITE_CHROMA_TENANT (default resolved via /auth/identity)
// - VITE_CHROMA_DATABASE (default resolved via /auth/identity)

const BASE_URL: string = (import.meta as any).env?.VITE_CHROMA_URL || '/chroma';
const COLLECTION_NAME: string = (import.meta as any).env?.VITE_CHROMA_COLLECTION || 'knowledge_sources';
const ENV_TENANT: string | undefined = (import.meta as any).env?.VITE_CHROMA_TENANT;
const ENV_DATABASE: string | undefined = (import.meta as any).env?.VITE_CHROMA_DATABASE;

interface CollectionContext {
  tenant: string;
  database: string;
  id: string;
}

const encode = (value: string) => encodeURIComponent(value);

const request = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chroma request failed ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return null as unknown as any;
};

let collectionContextPromise: Promise<CollectionContext> | null = null;

const resolveTenantAndDatabase = async (): Promise<{ tenant: string; database: string }> => {
  if (ENV_TENANT && ENV_DATABASE) {
    return { tenant: ENV_TENANT, database: ENV_DATABASE };
  }

  try {
    const identity = await request('/api/v2/auth/identity', { method: 'GET' });
    const tenant = ENV_TENANT || identity?.tenant || 'default_tenant';
    const database = ENV_DATABASE || identity?.databases?.[0] || 'default_database';
    return { tenant, database };
  } catch (error) {
    console.warn('[chroma] Failed to fetch identity, using defaults.', error);
    return {
      tenant: ENV_TENANT || 'default_tenant',
      database: ENV_DATABASE || 'default_database',
    };
  }
};

const listCollections = async (tenant: string, database: string) => {
  const data = await request(`/api/v2/tenants/${encode(tenant)}/databases/${encode(database)}/collections`, { method: 'GET' });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.collections)) return data.collections;
  return [];
};

const createCollection = async (tenant: string, database: string) => {
  return request(`/api/v2/tenants/${encode(tenant)}/databases/${encode(database)}/collections`, {
    method: 'POST',
    body: JSON.stringify({ name: COLLECTION_NAME, get_or_create: true }),
  });
};

const getCollectionContext = async (): Promise<CollectionContext> => {
  if (!collectionContextPromise) {
    collectionContextPromise = (async () => {
      const { tenant, database } = await resolveTenantAndDatabase();

      try {
        const collections = await listCollections(tenant, database);
        const existing = collections?.find?.((c: any) => c?.name === COLLECTION_NAME);
        if (existing?.id) {
          return { tenant: existing?.tenant || tenant, database: existing?.database || database, id: existing.id };
        }
      } catch (err) {
        console.warn('[chroma] Failed to list collections, will attempt create.', err);
      }

      const created = await createCollection(tenant, database);
      if (created?.id) {
        return { tenant: created?.tenant || tenant, database: created?.database || database, id: created.id };
      }

      throw new Error('Unable to obtain Chroma collection id');
    })();
  }
  return collectionContextPromise;
};

const buildCollectionPath = async (suffix: string) => {
  const { tenant, database, id } = await getCollectionContext();
  return `/api/v2/tenants/${encode(tenant)}/databases/${encode(database)}/collections/${id}${suffix}`;
};

const buildEmbeddings = async (sources: KnowledgeSource[], documents: string[]) => {
  return Promise.all(
    sources.map(async (source, index) => {
      if (Array.isArray(source.embedding) && source.embedding.length > 0) {
        return source.embedding;
      }
      return generateEmbedding(documents[index]);
    }),
  );
};

export const upsertSources = async (sources: KnowledgeSource[]): Promise<void> => {
  if (!sources || sources.length === 0) return;
  const documents = sources.map(s => s.data || s.content || '');
  const metadatas = sources.map(s => ({ type: s.type, createdAt: s.createdAt }));
  const embeddings = await buildEmbeddings(sources, documents);
  const path = await buildCollectionPath('/upsert');

  await request(path, {
    method: 'POST',
    body: JSON.stringify({
      ids: sources.map(s => s.id),
      documents,
      metadatas,
      embeddings,
    }),
  });
};

export const deleteSource = async (id: string): Promise<void> => {
  const path = await buildCollectionPath('/delete');
  await request(path, {
    method: 'POST',
    body: JSON.stringify({ ids: [id] }),
  });
};

export const querySimilar = async (query: string, topK: number = 5): Promise<{ id: string; distance?: number }[]> => {
  const path = await buildCollectionPath('/query');
  const queryEmbedding = await generateEmbedding(query);

  const resp = await request(path, {
    method: 'POST',
    body: JSON.stringify({ query_embeddings: [queryEmbedding], n_results: topK }),
  });

  const ids: string[] = Array.isArray(resp?.ids?.[0]) ? resp.ids[0] : [];
  const distances: number[] = Array.isArray(resp?.distances?.[0]) ? resp.distances[0] : [];
  return ids.map((id, idx) => ({ id, distance: distances[idx] }));
};

export const distanceToCosineSimilarity = (distance?: number): number => {
  if (distance == null) return 0;
  // Assuming cosine distance; similarity = 1 - distance
  const sim = 1 - distance;
  return Math.max(0, Math.min(1, sim));
};
