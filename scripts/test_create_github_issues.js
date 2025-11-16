#!/usr/bin/env node
// Test helper: checks which issues from `.github/ISSUES/*.md` are missing in the repo.
// Usage: set GITHUB_TOKEN env var and run:
//   node scripts/test_create_github_issues.js --repo fusbox/ChatArbor_AI_Studio

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

function argvGet(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv.length > idx + 1) return process.argv[idx + 1];
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (arg) return arg.split('=')[1];
  return null;
}

async function listIssueFiles() {
  const dir = path.join(process.cwd(), '.github', 'ISSUES');
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries.filter(e => e.isFile() && e.name.endsWith('.md')).map(e => path.join(dir, e.name));
  const items = [];
  for (const f of files) {
    const txt = await fs.readFile(f, 'utf8');
    const titleLine = txt.split('\n').find(l => l.trim().length > 0);
    const title = titleLine ? titleLine.replace(/^#+\s*/, '').trim() : path.basename(f);
    items.push({ path: f, title });
  }
  return items;
}

function ghApiGet(repo, token, apiPath) {
  const opts = {
    hostname: 'api.github.com',
    path: `/repos/${repo}${apiPath}`,
    headers: {
      'User-Agent': 'test-create-github-issues',
      'Accept': 'application/vnd.github+json',
      Authorization: `token ${token}`
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async function main() {
  const repo = argvGet('repo') || process.env.GITHUB_REPOSITORY || 'fusbox/ChatArbor_AI_Studio';
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Please set GITHUB_TOKEN env var with repo read access.');
    process.exit(2);
  }

  const files = await listIssueFiles();
  console.log(`Found ${files.length} issue files.`);

  // Fetch all issues (open+closed), paginated
  let page = 1;
  const issues = [];
  while (true) {
    const res = await ghApiGet(repo, token, `/issues?state=all&per_page=100&page=${page}`);
    if (!res || res.length === 0) break;
    issues.push(...res);
    if (res.length < 100) break;
    page++;
  }
  const titles = new Set(issues.map(i => i.title));

  const missing = files.filter(f => !titles.has(f.title));
  if (missing.length === 0) {
    console.log('All issue files are already present as GitHub issues (idempotent).');
  } else {
    console.log(`Missing ${missing.length} issues:`);
    for (const m of missing) console.log('- ' + m.title + `  (${m.path})`);
  }
})();
