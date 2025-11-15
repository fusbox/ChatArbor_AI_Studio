# Automation: Add workflow to sync labels to Project columns

Implement a GitHub Action or workflow that, when an issue is labeled (e.g., `triage`, `ready`, `in progress`), automatically adds or moves the issue to a specific Project board column.

**Description**
- Evaluate GitHub Actions or third-party actions that can sync labels to project columns.
- Implement a workflow that uses repository project ID or name to map labels to columns.
- Provide configuration or a small mapping file in the repo for label→column mapping.

**Acceptance criteria**
- New issues labeled `triage` are automatically added to the project's `Triage` column.
- Issues labeled `ready` move to `Ready / To Do` column.
- Automation is documented in `docs/projects/project-board-template.md`.

**Suggested labels:** `infra / ops`, `automation`
