#!/usr/bin/env bash
set -e

echo "🔄 Auto-sync starting..."

# Disable Replit's askpass helper so Git uses our credential helper instead
# of popping up an interactive prompt that always fails on headless runs.
unset GIT_ASKPASS
unset SSH_ASKPASS
export GIT_TERMINAL_PROMPT=0

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATUS_FILE="$REPO_ROOT/.sync-status.json"

# Write a JSON status file and optionally send a Slack notification.
# Usage: notify_failure <branch> <summary>
notify_failure() {
  local branch="$1"
  local summary="$2"
  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  # Escape double-quotes and backslashes for safe JSON embedding.
  local branch_safe summary_safe
  branch_safe="${branch//\\/\\\\}"
  branch_safe="${branch_safe//\"/\\\"}"
  summary_safe="${summary//\\/\\\\}"
  summary_safe="${summary_safe//\"/\\\"}"

  # Always write a machine-readable status file so CI or dashboards can check it.
  cat > "$STATUS_FILE" <<EOF
{
  "status": "failed",
  "branch": "$branch_safe",
  "summary": "$summary_safe",
  "timestamp": "$timestamp"
}
EOF
  echo "📄 Failure status written to $STATUS_FILE"

  # Send a Slack notification if a webhook URL is configured.
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    local payload
    payload=$(printf '{"text":"❌ *Auto-sync failed* on branch `%s`\n>%s\n_Timestamp: %s_"}' \
      "$branch_safe" "$summary_safe" "$timestamp")
    if curl -s -o /dev/null -w "%{http_code}" \
         -X POST -H "Content-Type: application/json" \
         -d "$payload" \
         "$SLACK_WEBHOOK_URL" | grep -q "^2"; then
      echo "🔔 Slack notification sent."
    else
      echo "⚠️  Slack notification failed (check SLACK_WEBHOOK_URL)."
    fi
  else
    echo "ℹ️  SLACK_WEBHOOK_URL is not set — skipping Slack notification."
    echo "   Set it in Replit Secrets to enable Slack alerts on failure."
  fi
}

if [ -z "${SFS_PAT:-}" ]; then
  echo "❌ SFS_PAT is not set. Add it to Replit Secrets and try again."
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
  notify_failure "$BRANCH" "SFS_PAT secret is not set — auto-sync cannot authenticate."
  exit 1
fi

export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-${SFS_USERNAME:-Auto Sync Bot}}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-auto-sync@smartflow-systems.local}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-$GIT_AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-$GIT_AUTHOR_EMAIL}"

HELPER="$REPO_ROOT/scripts/git-credential-sfs.sh"
chmod +x "$HELPER" 2>/dev/null || true

# Use -c so the helper is only used for this invocation; "" first clears any
# inherited helpers (e.g. cached credentials) that could short-circuit ours.
GIT="git -c credential.helper= -c credential.helper=$HELPER"

# Quick non-interactive auth self-check before we touch anything.
if ! $GIT ls-remote origin HEAD >/dev/null 2>&1; then
  echo "❌ Could not authenticate to origin. Check that SFS_PAT is valid"
  echo "   and that the token has push access to the configured remote:"
  git remote get-url origin
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
  notify_failure "$BRANCH" "Authentication failed — SFS_PAT may be invalid or missing push access."
  exit 1
fi

git add -A
git commit -m "chore: auto-commit [Auto-Sync]" || true

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if ! $GIT fetch origin; then
  echo "❌ Failed to fetch from origin — check network connectivity and credentials."
  notify_failure "$CURRENT_BRANCH" "Failed to fetch from origin — network or credential error."
  exit 1
fi
if ! $GIT pull --rebase origin "$CURRENT_BRANCH"; then
  echo "❌ Rebase failed — likely a conflict with the remote branch."
  echo "   Run 'git rebase --abort' to restore the branch, then resolve conflicts manually."
  $GIT rebase --abort 2>/dev/null || true
  notify_failure "$CURRENT_BRANCH" "Rebase conflict with origin/$CURRENT_BRANCH — manual resolution required."
  exit 1
fi
if ! $GIT push origin "HEAD:$CURRENT_BRANCH"; then
  echo "❌ Push failed — the remote may have diverged or push permissions changed."
  notify_failure "$CURRENT_BRANCH" "Push to origin/$CURRENT_BRANCH failed — check remote state and permissions."
  exit 1
fi

# Clear any previous failure status on success.
cat > "$STATUS_FILE" <<EOF
{
  "status": "ok",
  "branch": "$CURRENT_BRANCH",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "✅ Auto-sync complete!"
