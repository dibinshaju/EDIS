#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/nonsence/EDIS"
LOG_FILE="$REPO_DIR/auto_push.log"

mkdir -p "$REPO_DIR"

if ! git -C "$REPO_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Not a git repository: $REPO_DIR" >> "$LOG_FILE"
  exit 1
fi

BRANCH="$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")"

if ! git -C "$REPO_DIR" config user.name >/dev/null 2>&1; then
  git -C "$REPO_DIR" config user.name "Auto Push Bot"
fi

if ! git -C "$REPO_DIR" config user.email >/dev/null 2>&1; then
  git -C "$REPO_DIR" config user.email "auto-push-bot@localhost"
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting auto-push for branch: $BRANCH" >> "$LOG_FILE"

git -C "$REPO_DIR" add -A

if git -C "$REPO_DIR" diff --cached --quiet; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] No changes to commit." >> "$LOG_FILE"
  exit 0
fi

git -C "$REPO_DIR" commit -m "Auto commit $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$LOG_FILE" 2>&1

git -C "$REPO_DIR" push origin "$BRANCH" >> "$LOG_FILE" 2>&1

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Auto-push completed successfully." >> "$LOG_FILE"
