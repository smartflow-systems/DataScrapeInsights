#!/usr/bin/env bash
set -e

echo "🔄 Auto-sync starting..."

# Disable Replit's askpass helper so Git uses our credential helper instead
# of popping up an interactive prompt that always fails on headless runs.
unset GIT_ASKPASS
unset SSH_ASKPASS
export GIT_TERMINAL_PROMPT=0

if [ -z "${SFS_PAT:-}" ]; then
  echo "❌ SFS_PAT is not set. Add it to Replit Secrets and try again."
  exit 1
fi

export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-${SFS_USERNAME:-Auto Sync Bot}}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-auto-sync@smartflow-systems.local}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-$GIT_AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-$GIT_AUTHOR_EMAIL}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
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
  exit 1
fi

git add -A
git commit -m "chore: auto-commit [Auto-Sync]" || true

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

$GIT fetch origin || true
$GIT pull --no-rebase --no-edit origin "$CURRENT_BRANCH" || true
$GIT push origin "HEAD:$CURRENT_BRANCH"

echo "✅ Auto-sync complete!"
