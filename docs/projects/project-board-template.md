# Project Board Template

This is a suggested structure for a GitHub Project (Kanban) to manage work.

Columns:
- Backlog: New ideas and requests
- Triage: Issues being reviewed and prioritized
- Ready / To Do: Groomed tasks ready for work
- In Progress: Actively being worked on
- Review / QA: Waiting for review or verification
- Done: Completed work

Starter cards (create these as Issues and then add to project):
- Triage: "Create labels and templates" (# add link to this docs page)
- Backlog: "Migrate mock API to backend"
- Backlog: "Add embedding-similarity integration"
- Backlog: "Improve evaluation dataset with more references"
 - Backlog: "Create labels and templates" (see `.github/ISSUES/0001-backlog.md`)
 - Triage: "Review templates & seed project board" (see `.github/ISSUES/0002-triage.md`)

Suggested automation:
- Move issues to "Review / QA" when a PR is merged referencing the issue.
- Automatically add issues labeled `good first issue` to `Backlog` and `good first issue` column.

How to create the board:
1. In GitHub, go to the repository -> Projects -> New project (Classic) or Projects (beta).
2. Create columns matching the template above.
3. Create issues from the starter card list and add them to the Backlog.
