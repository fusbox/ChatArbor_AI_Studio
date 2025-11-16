# CI / Ops Playbook (Evaluation & Nightly Runs)

## Nightly Evaluation
- Workflow: `.github/workflows/eval-nightly.yml` runs daily and uploads `evaluation/summary.json`.
- To run manually locally:
```powershell
npm install
npm run eval:run
```
- To run against a remote backend (use secrets in CI or environment locally):
```powershell
$env:EVAL_API_HOST = "http://localhost:3001"
$env:EVAL_API_KEY = "<token>"
npm run eval:run
```

## Troubleshooting
- If `ts-node` reports unknown extension errors: ensure `ts-node` and `@types/node` are installed and the `node --loader ts-node/esm` invocation is used (see `package.json`).
- If embeddings fail: ensure `services/geminiService` is configured with a valid API key on the server side.
- If CI fails to upload artifacts: check `actions/upload-artifact` step and that `evaluation/summary.json` exists after the run.

## Adding new dataset versions
- Add a new JSON file under `evaluation/dataset/` (e.g., `dataset/v2_queries.json`) and update runner or create a small script to point to it.

## Security
- Store any private keys (e.g., `EVAL_API_KEY`) as GitHub Secrets, not in repo.
