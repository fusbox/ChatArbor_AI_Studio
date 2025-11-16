# PowerShell script to create GitHub issues from repo files using gh CLI
# Requires: GitHub CLI authenticated (gh auth login)

$files = @(
  @{ path = '.github/ISSUES/0001-backlog.md'; title = "Backlog: Starter Card - Create labels and templates"; labels = 'backlog,documentation' },
  @{ path = '.github/ISSUES/0002-triage.md'; title = "Triage: Review templates and seed project board"; labels = 'triage,project' },
  @{ path = '.github/ISSUES/0003-auto-project-automation.md'; title = "Automation: Add workflow to sync labels to Project columns"; labels = 'infra / ops,automation' },
  @{ path = '.github/ISSUES/0004-create-project-board.md'; title = "Task: Create Project Board (using template)"; labels = 'project,backlog' }
)

# Determine repository (nameWithOwner) from gh context
try {
  $repo = gh repo view --json nameWithOwner -q .nameWithOwner
} catch {
  Write-Host "Could not determine repo from gh context. Falling back to 'fusbox/ChatArbor_AI_Studio'"
  $repo = 'fusbox/ChatArbor_AI_Studio'
}

# Fetch existing labels once
$existingLabels = @()
try {
  $existingLabels = gh api "/repos/$repo/labels" --method GET --jq '.[] | .name' | ForEach-Object { $_ }
} catch {
  Write-Host "Warning: could not fetch existing labels: $_"
}

# Helper: normalize titles for comparison (replace smart dashes/quotes, collapse whitespace, lowercase)
function ConvertTo-NormalizedTitle {
  param($s)
  if (-not $s) { return '' }
  # replace proper Unicode dashes/quotes
  $s = $s -replace "[\u2014\u2013]", ' - '
  $s = $s -replace "[\u2018\u2019]", "'"
  $s = $s -replace "[\u201C\u201D]", '"'
  # handle common mojibake sequences when files are read with wrong encoding
  $s = $s -replace 'â€"|â€"|â€"', ' - '
  $s = $s -replace 'â€™|â€˜', "'"
  $s = $s -replace 'â€œ|â€�', '"'
  # normalize ampersand to 'and' for comparison
  $s = $s -replace '&', ' and '
  $s = $s -replace '\s+', ' '
  $s = $s.Trim()
  return $s.ToLowerInvariant()
}

# Fetch existing issue titles to avoid creating duplicates (idempotence)
$existingIssueTitles = @()
try {
  $existingIssueTitles = gh api "/repos/$repo/issues?state=all&per_page=200" --method GET --jq '.[] | .title' | ForEach-Object { ConvertTo-NormalizedTitle $_ }
} catch {
  Write-Host "Warning: could not fetch existing issues: $_"
}

foreach ($f in $files) {
  Write-Host "Creating issue: $($f.title)"
  $body = Get-Content $f.path -Raw

  # Ensure each label exists; create if missing
  $labels = $f.labels -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
  foreach ($lbl in $labels) {
    if (-not ($existingLabels -contains $lbl)) {
      Write-Host "Label '$lbl' not found - creating..."
      try {
        gh label create "$lbl" --repo $repo --color C2E0FF --description "Auto-created label"
        $existingLabels += $lbl
      } catch {
        Write-Host "Warning: failed to create label '$lbl': $_"
      }
    }
  }

  # Create the issue with labels
  # Skip creation if an issue with the same normalized title already exists
  $normLocal = ConvertTo-NormalizedTitle $f.title
  if ($existingIssueTitles -contains $normLocal) {
    Write-Host "Skipping creation; issue with title already exists (normalized): $($f.title)"
    continue
  }

  try {
    gh issue create --repo $repo --title "$($f.title)" --body "$body" --label ($labels -join ',')
    Write-Host "Created issue: $($f.title)"
    # add normalized title to existingIssueTitles to avoid duplicates in the same run
    $existingIssueTitles += $normLocal
  } catch {
    Write-Host "Failed to create issue '$($f.title)': $_"
  }
}

#!/usr/bin/env pwsh
# PowerShell script to create GitHub issues from repo files using gh CLI
# Requires: GitHub CLI authenticated (gh auth login)

$files = @(
  @{ path = '.github/ISSUES/0001-backlog.md'; title = 'Backlog: Starter Card - Create labels and templates'; labels = 'backlog,documentation' },
  @{ path = '.github/ISSUES/0002-triage.md'; title = 'Triage: Review templates and seed project board'; labels = 'triage,project' },
  @{ path = '.github/ISSUES/0003-auto-project-automation.md'; title = 'Automation: Add workflow to sync labels to Project columns'; labels = 'infra / ops,automation' },
  @{ path = '.github/ISSUES/0004-create-project-board.md'; title = 'Task: Create Project Board (using template)'; labels = 'project,backlog' }
)

function Get-RepoNameWithOwner {
  try {
    return (gh repo view --json nameWithOwner -q .nameWithOwner)
  } catch {
    Write-Host "Could not determine repo from gh context. Falling back to 'fusbox/ChatArbor_AI_Studio'"
    return 'fusbox/ChatArbor_AI_Studio'
  }
}

$repo = Get-RepoNameWithOwner

# Fetch existing labels once
$existingLabels = @()
try {
  $existingLabels = gh api "/repos/$repo/labels" --method GET --jq '.[] | .name' | ForEach-Object { $_ }
} catch {
  Write-Host "Warning: could not fetch existing labels: $_"
}

foreach ($f in $files) {
  Write-Host "Creating issue: $($f.title)"
  $body = Get-Content -Raw -Path $f.path

  # Ensure each label exists; create if missing
  $labels = $f.labels -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
  foreach ($lbl in $labels) {
    if (-not ($existingLabels -contains $lbl)) {
      Write-Host "Label '$lbl' not found - creating..."
      try {
        gh label create "$lbl" --repo $repo --color C2E0FF --description "Auto-created label"
        $existingLabels += $lbl
      } catch {
        Write-Host "Warning: failed to create label '$lbl': $_"
      }
    }
  }

  try {
    gh issue create --repo $repo --title "$($f.title)" --body "$body" --label ($labels -join ',')
    Write-Host "Created issue: $($f.title)"
  } catch {
    Write-Host "Failed to create issue '$($f.title)': $_"
  }
}

Write-Host 'Done. Check the repository Issues tab.'

