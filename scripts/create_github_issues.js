#!/usr/bin/env node
// Create GitHub issues from `.github/ISSUES/*.md` using a personal access token.
// Usage (PowerShell):
// $env:GITHUB_TOKEN = 'ghp_...'; node .\scripts\create_github_issues.js --repo fusbox/ChatArbor_AI_Studio

const fs = require('fs').promises;
const path = require('path');

async function main() {
  const argv = process.argv.slice(2);
  const repoArg = argv.find(a => a.startsWith('--repo='));
  let repo = null;
  if (repoArg) repo = repoArg.split('=')[1];
  else {
    const idx = argv.indexOf('--repo');
    if (idx >= 0 && argv.length > idx + 1) repo = argv[idx + 1];
  }

  if (!repo) {
    console.error('Missing --repo owner/repo');
    process.exit(2);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Missing GITHUB_TOKEN environment variable. Export a personal access token with `repo` scope.');
    process.exit(3);
  }

  const files = [
    { path: '.github/ISSUES/0001-backlog.md', title: 'Backlog: Starter Card — Create labels and templates', labels: ['backlog','documentation'] },
    { path: '.github/ISSUES/0002-triage.md', title: 'Triage: Review templates & seed project board', labels: ['triage','project'] },
    { path: '.github/ISSUES/0003-auto-project-automation.md', title: 'Automation: Add workflow to sync labels to Project columns', labels: ['infra / ops','automation'] },
    { path: '.github/ISSUES/0004-create-project-board.md', title: 'Task: Create Project Board (using template)', labels: ['project','backlog'] }
  ];

  const baseUrl = `https://api.github.com/repos/${repo}/issues`;

  for (const f of files) {
    try {
      const body = await fs.readFile(path.join(process.cwd(), f.path), 'utf8');
      console.log(`Creating issue: ${f.title}`);

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'create-github-issues-script'
        },
        body: JSON.stringify({ title: f.title, body, labels: f.labels })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`Failed to create issue ${f.title}: ${res.status} ${res.statusText}\n${text}`);
        continue;
      }

      const data = await res.json();
      console.log(`Created: ${data.html_url}`);
    } catch (err) {
      console.error(`Error processing ${f.path}:`, err.message || err);
    }
  }

  console.log('Done. Check the repository Issues tab.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
