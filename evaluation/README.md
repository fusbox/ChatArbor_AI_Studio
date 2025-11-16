Evaluation Framework

## Purpose
- Provide a small, extensible evaluation harness for the current local prototype that is easy to adapt to a production backend.
- Keep the harness backend-agnostic by calling `services/apiService` where possible; when running against a production API, set `EVAL_API_HOST` and the runner switches to remote HTTP calls.

## Quick Start

### Local Prototype (Default)
1. Install dev dependencies:
```powershell
npm install
```

2. Run evaluation against the mock backend:
```powershell
npm run eval:run
```

This produces:
- `evaluation/results.json` — individual query responses
- `evaluation/summary.json` — metrics (avg length, non-empty rate, keyword coverage)
 - `evaluation/summary.json` now also includes `avgEmbeddingSimilarity` (semantic similarity between query and response)

### Production Backend
1. Start your backend server:
```powershell
npm run build:backend
npm run start:backend
# e.g., backend listens on http://localhost:3001
```

2. Run evaluation against the remote backend:
```powershell
$env:EVAL_API_HOST = "http://localhost:3001"
npm run eval:run
```

Or on one line:
```bash
EVAL_API_HOST=http://localhost:3001 npm run eval:run
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `EVAL_API_HOST` | Remote backend endpoint | `http://localhost:3001` or `https://api.prod.example.com` |
| `EVAL_API_KEY` | Optional auth token (sent as `Authorization: Bearer <token>`) | `secret-key-123` |
| `EVAL_TIMEOUT_MS` | Request timeout (default: 30000) | `60000` |

If `EVAL_API_HOST` is not set, the runner uses the local mock backend.

## What This Scaffold Contains

- `runner.ts` — TypeScript runner that loads queries, calls chat API (local or remote), records responses, and computes basic metrics.
- `config.ts` — Configuration loader; supports environment variable overrides for backend URL and auth.
- `metrics.ts` — Helper functions to compute simple metrics (average length, non-empty rate, keyword coverage).
 - `dataset/sample_queries.json` — Example queries, expected keywords, and true reference answers for BLEU/ROUGE.

## How to Adapt for Production

### Backend Endpoint Contract

The runner expects your backend to expose:
```
POST /api/chat
Content-Type: application/json
Authorization: Bearer <EVAL_API_KEY>  (optional, if EVAL_API_KEY is set)

Request Body:
{
  "query": "user question",
  "history": [
    { "role": "user", "parts": [{ "text": "..." }] },
    { "role": "model", "parts": [{ "text": "..." }] }
  ]
}

Response Body:
{
  "response": "AI response text"
}
```

### Express.js Backend Example
```typescript
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { query, history } = req.body;
    
    // Call Gemini with the query and history
    const model = genai.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(query);
    const response = result.response.text();
    
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(3001, () => console.log('Server running on :3001'));
```

### Switching from Mock to Real Backend

1. **Keep the local mock service** for development/testing (`npm run dev` uses it).
2. **For evaluation**: Start your backend, set `EVAL_API_HOST`, and run `npm run eval:run`.
3. **In the future**: If you migrate the frontend to call your backend directly, the evaluation runner will automatically pick up the backend API without code changes.

## Extending Metrics


Replace or add metrics in `metrics.ts`:
- **BLEU/ROUGE scores** — The runner computes BLEU-1 and ROUGE-L for each result using the `reference` field in the dataset (if present), or falls back to the query. BLEU/ROUGE are written to `results.json` and exported in CSV.
- **Embedding similarity** — Uses `services/geminiService.generateEmbedding()` to compare query embeddings with response embeddings. The runner records `avgEmbeddingSimilarity` in `evaluation/summary.json` and per-result in `results.json`.
- **Custom domain metrics** — E.g., for job seeker chatbot: "Did response mention salary ranges?" or "Did response suggest relevant certifications?".

## CI: Nightly Evaluation

A GitHub Actions workflow is included at `.github/workflows/eval-nightly.yml` which:

- Runs the evaluation daily (cron) and on-demand (`workflow_dispatch`).
- Installs dependencies, runs `npm run eval:run`, and uploads `evaluation/summary.json` as an artifact.

To run against a remote backend, set repository Secrets `EVAL_API_HOST` and (optionally) `EVAL_API_KEY` in GitHub settings. The workflow will pass them through as environment variables.

## Notes

- This runner is intentionally small and dependency-light. For large-scale evaluation consider a separate evaluation service, dataset versioning, and metric tracking over time.
- Store evaluation results (snapshots of `summary.json`) in a results directory with timestamps to track performance trends.

