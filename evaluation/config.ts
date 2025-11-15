/**
 * Evaluation Configuration
 *
 * This module handles environment-based configuration for the evaluation runner.
 * It supports running against the local mock backend (default) or a remote production backend.
 *
 * Environment Variables:
 * - EVAL_API_HOST: Remote API host (e.g., "http://localhost:3001" or "https://api.example.com")
 *   If not set, the runner uses the local mock backend via services/apiService.
 * - EVAL_API_KEY: Optional API key for authentication (sent as Authorization header if set).
 * - EVAL_TIMEOUT_MS: Request timeout in milliseconds (default: 30000).
 */

export interface EvalConfig {
  apiHost?: string;
  apiKey?: string;
  timeoutMs: number;
  useLocalBackend: boolean;
}

export const loadConfig = (): EvalConfig => {
  const apiHost = process.env.EVAL_API_HOST;
  const apiKey = process.env.EVAL_API_KEY;
  const timeoutMs = parseInt(process.env.EVAL_TIMEOUT_MS || '30000', 10);

  return {
    apiHost,
    apiKey,
    timeoutMs,
    useLocalBackend: !apiHost,
  };
};

/**
 * For production backend integration:
 *
 * 1. Start your backend server on a known port (e.g., 3001):
 *    $ npm run build:backend && npm run start:backend
 *
 * 2. Run evaluation against the remote backend:
 *    $ EVAL_API_HOST=http://localhost:3001 npm run eval:run
 *
 * 3. The runner will call your backend's /api/chat endpoint instead of the mock service.
 *
 * Expected backend endpoint:
 *   POST /api/chat
 *   Body: { query: string, history?: { role: string; parts: { text: string }[] }[] }
 *   Response: { response: string }
 *
 * Example backend stub (Express.js):
 *   app.post('/api/chat', async (req, res) => {
 *     const { query, history } = req.body;
 *     // Call Gemini API with query + history
 *     const response = await geminiClient.chat(query, history);
 *     res.json({ response });
 *   });
 */
