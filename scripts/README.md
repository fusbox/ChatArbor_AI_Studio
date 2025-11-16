# Issue Seeder Scripts

This folder contains helper scripts to seed the repository with starter issues.

Files
- `create_github_issues.ps1` — PowerShell script that creates starter issues from `.github/ISSUES/*.md`. It will:
  - Auto-create any missing labels used by the issue files.
  - Skip creating an issue if an issue with the same title already exists (idempotent).
  - Usage: `.	emplates?` — actually the script is in `scripts/`.

- `create_github_issues.js` — Node fallback that uses `GITHUB_TOKEN` to create issues via the GitHub REST API.
- `test_create_github_issues.cjs` — CommonJS test helper that checks which `.github/ISSUES/*.md` files are missing as GitHub issues.

Running the PowerShell script (recommended when `gh` CLI is installed and authenticated)

1. Make sure `gh` is installed and authenticated:
```powershell
gh --version
gh auth login --web
gh auth status
```

2. Run the script:
```powershell
# From repository root
.\scripts\create_github_issues.ps1
```

Notes:
- The script is idempotent: running it multiple times will not create duplicate issues because it checks for existing issue titles.
- The script will create any missing labels automatically.

Node fallback (when `gh` is not available)

1. Create a personal access token with `repo` scope and export it:
```powershell
$env:GITHUB_TOKEN = 'ghp_...'
```

2. Run the Node script (replace `owner/repo` with your repository):
```powershell
node .\scripts\create_github_issues.js --repo fusbox/ChatArbor_AI_Studio
```

Testing idempotence

- There's a small test helper `scripts/test_create_github_issues.cjs` which will check existing issues versus the `.github/ISSUES` files and print which issues would be created. It requires `GITHUB_TOKEN` to query the GitHub API. See its own usage notes.

Security

- Do not commit tokens. Use environment variables for tokens, and revoke short-lived tokens when done.
