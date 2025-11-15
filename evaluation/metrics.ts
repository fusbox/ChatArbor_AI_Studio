export const avgResponseLength = (responses: string[]) => {
  if (responses.length === 0) return 0;
  const total = responses.reduce((s, r) => s + (r ? r.length : 0), 0);
  return total / responses.length;
};

export const nonEmptyRate = (responses: string[]) => {
  if (responses.length === 0) return 0;
  const nonEmpty = responses.filter(r => r && r.trim().length > 0).length;
  return nonEmpty / responses.length;
};

export const keywordCoverage = (responses: string[], keywords: string[]) => {
  if (!keywords || keywords.length === 0) return 1;
  const lower = responses.map(r => (r || '').toLowerCase());
  const hits = keywords.map(k => lower.some(r => r.includes(k.toLowerCase())) ? 1 : 0);
  return hits.reduce((a, b) => a + b, 0) / keywords.length;
};

// Embedding-based similarity (semantic similarity)
import { generateEmbedding } from '../services/geminiService.js';

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
const magnitude = (a: number[]) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));

export const embeddingSimilarity = async (queries: string[], responses: string[]) => {
  // Compute cosine similarity between each query and response pair.
  // Returns average similarity across pairs.
  const pairs = Math.min(queries.length, responses.length);
  if (pairs === 0) return 0;

  const sims: number[] = [];
  for (let i = 0; i < pairs; i++) {
    try {
      const q = queries[i] || '';
      const r = responses[i] || '';
      const [qe, re] = await Promise.all([generateEmbedding(q), generateEmbedding(r)]);
      const magQ = magnitude(qe);
      const magR = magnitude(re);
      if (magQ === 0 || magR === 0) {
        sims.push(0);
        continue;
      }
      const sim = dot(qe, re) / (magQ * magR);
      sims.push(sim);
    } catch (err) {
      sims.push(0);
    }
  }

  const avg = sims.reduce((a, b) => a + b, 0) / sims.length;
  return avg;
};

// Return similarity per pair (array of numbers) in same order as inputs
export const embeddingSimilarityPerPair = async (queries: string[], responses: string[]) => {
  const pairs = Math.min(queries.length, responses.length);
  const sims: number[] = [];
  for (let i = 0; i < pairs; i++) {
    try {
      const q = queries[i] || '';
      const r = responses[i] || '';
      const [qe, re] = await Promise.all([generateEmbedding(q), generateEmbedding(r)]);
      const magQ = Math.sqrt(qe.reduce((s, v) => s + v * v, 0));
      const magR = Math.sqrt(re.reduce((s, v) => s + v * v, 0));
      if (magQ === 0 || magR === 0) {
        sims.push(0);
        continue;
      }
      const dot = qe.reduce((s, v, idx) => s + v * (re[idx] ?? 0), 0);
      sims.push(dot / (magQ * magR));
    } catch (err) {
      sims.push(0);
    }
  }
  return sims;
};

// Very small, dependency-free BLEU-1 (unigram precision) approximation.
export const bleu1 = (reference: string, candidate: string) => {
  const refTokens = (reference || '').toLowerCase().split(/\s+/).filter(Boolean);
  const candTokens = (candidate || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (candTokens.length === 0) return 0;
  const refCounts: Record<string, number> = {};
  refTokens.forEach(t => (refCounts[t] = (refCounts[t] || 0) + 1));
  let match = 0;
  candTokens.forEach(t => {
    if (refCounts[t] && refCounts[t] > 0) {
      match++;
      refCounts[t]--;
    }
  });
  return match / candTokens.length;
};

// Simple ROUGE-L approximation using LCS (longest common subsequence) at token level.
const lcsLength = (a: string[], b: string[]) => {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[n][m];
};

export const rougeL = (reference: string, candidate: string) => {
  const refTokens = (reference || '').toLowerCase().split(/\s+/).filter(Boolean);
  const candTokens = (candidate || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (refTokens.length === 0 || candTokens.length === 0) return 0;
  const lcs = lcsLength(refTokens, candTokens);
  // F-measure with beta=1 combining precision and recall from LCS
  const prec = lcs / candTokens.length;
  const rec = lcs / refTokens.length;
  if (prec + rec === 0) return 0;
  return (2 * prec * rec) / (prec + rec);
};
