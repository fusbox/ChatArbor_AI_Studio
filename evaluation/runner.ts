import fs from 'fs/promises';
import path from 'path';
import * as apiService from '../services/apiService.js';
import { avgResponseLength, nonEmptyRate, keywordCoverage, embeddingSimilarityPerPair, bleu1, rougeL } from './metrics.js';
import { writeCsv } from './exporter.js';
import { loadConfig } from './config.js';

type SampleQuery = { id: string; query: string; expectedKeywords?: string[]; reference?: string };

const DATASET_PATH = path.resolve(process.cwd(), 'evaluation', 'dataset', 'sample_queries.json');
const RESULTS_PATH = path.resolve(process.cwd(), 'evaluation', 'results.json');

async function loadDataset(): Promise<SampleQuery[]> {
  const raw = await fs.readFile(DATASET_PATH, 'utf8');
  return JSON.parse(raw) as SampleQuery[];
}

/**
 * Call the chat API.
 * If EVAL_API_HOST is set, calls the remote backend.
 * Otherwise, uses the local apiService (which calls mockApiService in the prototype).
 */
async function callChatApi(query: string, config: ReturnType<typeof loadConfig>): Promise<string> {
  if (config.useLocalBackend) {
    // Local prototype: call apiService.getChatResponse which uses mockApiService
    return await apiService.getChatResponse(query, []);
  } else {
    // Production backend: make HTTP request to remote endpoint
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${config.apiHost}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, history: [] }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { response: string };
    return data.response;
  }
}

async function run() {
  const config = loadConfig();
  console.log('Evaluation runner starting...');
  console.log(`Backend: ${config.useLocalBackend ? 'local (mock service)' : config.apiHost}`);

  const dataset = await loadDataset();
  const results: {
    id: string;
    query: string;
    response: string;
    timestamp: number;
    keywordsMatched?: number;
  }[] = [];

  for (const item of dataset) {
    console.log(`Running query ${item.id}: ${item.query}`);
    try {
      const response = await callChatApi(item.query, config);
      // compute per-result simple metrics (BLEU-1, ROUGE-L will be computed after loop)
      results.push({ id: item.id, query: item.query, response, timestamp: Date.now() });
    } catch (err) {
      console.error('Error for', item.id, err);
      results.push({ id: item.id, query: item.query, response: `ERROR: ${String(err)}`, timestamp: Date.now() });
    }
  }

  await fs.writeFile(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Wrote results to ${RESULTS_PATH}`);

  const responses = results.map(r => r.response || '');
  const avgLen = avgResponseLength(responses);
  const nonEmpty = nonEmptyRate(responses);

  // Embedding-based semantic similarity between queries and responses
  const perPairEmbedding = await embeddingSimilarityPerPair(dataset.map(d => d.query), responses);
  const avgEmbeddingSimilarity = perPairEmbedding.reduce((a, b) => a + b, 0) / (perPairEmbedding.length || 1);

  // Compute BLEU-1 and ROUGE-L per result (comparing response vs query as a lightweight proxy)
  for (let i = 0; i < results.length; i++) {
    const q = dataset[i]?.query || '';
    const r = responses[i] || '';
    const ref = dataset[i]?.reference || q;
    // attach per-result metrics
    // @ts-ignore - augmenting result entries
    results[i].embeddingSimilarity = perPairEmbedding[i] ?? 0;
    // @ts-ignore
    results[i].bleu1 = bleu1(ref, r);
    // @ts-ignore
    results[i].rougeL = rougeL(ref, r);
  }

  // Compute keyword coverage aggregated across dataset (average per query)
  const coverages = dataset.map((d, i) => keywordCoverage([responses[i]], d.expectedKeywords || []));
  const avgCoverage = coverages.reduce((a, b) => a + b, 0) / (coverages.length || 1);

  const summary = {
    runAt: Date.now(),
    backend: config.useLocalBackend ? 'local' : config.apiHost,
    count: results.length,
    avgLength: avgLen,
    nonEmptyRate: nonEmpty,
    avgKeywordCoverage: avgCoverage,
    avgEmbeddingSimilarity,
  };

  console.log('Summary:', summary);
  await fs.writeFile(path.resolve(process.cwd(), 'evaluation', 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  // ensure history folder exists and write timestamped summary copy
  const historyDir = path.resolve(process.cwd(), 'evaluation', 'history');
  try { await fs.mkdir(historyDir, { recursive: true }); } catch (e) {}
  const timestamped = path.resolve(historyDir, `summary_${Date.now()}.json`);
  await fs.writeFile(timestamped, JSON.stringify(summary, null, 2), 'utf8');

  // update results.json with per-result metrics
  await fs.writeFile(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');

  // write CSV export
  try {
    await writeCsv(results, path.resolve(process.cwd(), 'evaluation', 'results.csv'));
    console.log('Wrote CSV to evaluation/results.csv');
  } catch (err) {
    console.warn('Failed to write CSV export:', err);
  }
  console.log('Evaluation complete.');
}

run().catch(err => {
  console.error('Fatal error in evaluation runner', err);
  process.exit(1);
});
