# Contributor Templates & How to Use Them

This repo includes templates and reference documents to streamline reporting, prioritization, and releases.

Where to find them
- Issue templates: `.github/ISSUE_TEMPLATE/` (bug_report.md, feature_request.md, security_issue.md)
- PR template: `.github/PULL_REQUEST_TEMPLATE.md`
- Roles & labels: `docs/reference/roles.md`, `docs/templates/labels.md`
- QA, release and CI guides: `docs/templates/qa_test_case.md`, `docs/templates/release_checklist.md`, `docs/templates/ci_playbook.md`

Quick usage
- When filing a bug or feature, choose the matching issue template to pre-fill the required details.
- For security problems that must remain private, contact the security email mentioned in `security_issue.md` instead of opening a public issue.
- For PRs, fill in the checklist in `.github/PULL_REQUEST_TEMPLATE.md` and link related issues (e.g., `Fixes #123`).
- QA engineers: use `docs/templates/qa_test_case.md` for consistent test case reporting.
- Release admins: follow `docs/templates/release_checklist.md` before deploying to production.

Labels & triage
- Use the label guide in `docs/templates/labels.md` when triaging issues.
- Suggested labels include `bug`, `enhancement`, `security`, `performance`, `qa`, `docs`, `infra`, and priority flags like `P0`/`P1` if desired.


## Creating the starter project board and issues

Starter issues are available under `.github/ISSUES/` and can be used to seed the project board:

- `.github/ISSUES/0001-backlog.md` — Backlog starter card
- `.github/ISSUES/0002-triage.md` — Triage starter card
- `.github/ISSUES/0003-auto-project-automation.md` — Automation task to add label→column sync
- `.github/ISSUES/0004-create-project-board.md` — Task to create the Project board

If you have the GitHub CLI (`gh`) installed and authenticated, you can run `scripts/create_github_issues.ps1` (PowerShell) to create these issues in the repository.
3. Update `docs/CONTRIBUTING_TEMPLATES.md` with a short description of new template and intended use.

If you'd like, I can:
- Add GitHub Action automation to apply labels based on templates or content.
- Create an initial Project board (kanban) populated with backlog and triage columns.
