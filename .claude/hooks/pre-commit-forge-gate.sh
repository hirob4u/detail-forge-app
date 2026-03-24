#!/usr/bin/env bash
# Claude Code PreToolUse hook: blocks git commit if forge files are not staged.
# Receives JSON on stdin with the bash command about to run.
# Exit 0 = allow, Exit 2 = block with stderr feedback.

set -uo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE "^git commit"; then
  exit 0
fi

REQUIRED_FILES=(
  "docs/build-log.md"
  "docs/blueprint-errata.md"
  "forge/patterns.md"
)

# Get staged files
STAGED=$(git diff --cached --name-only 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

# Skip check if no src/ or drizzle/ files are staged (docs/config-only commits)
HAS_SRC=$(echo "$STAGED" | grep -c "^src/" || true)
HAS_DRIZZLE=$(echo "$STAGED" | grep -c "^drizzle/" || true)

if [ "$HAS_SRC" -eq 0 ] && [ "$HAS_DRIZZLE" -eq 0 ]; then
  exit 0
fi

MISSING=()
for f in "${REQUIRED_FILES[@]}"; do
  if ! echo "$STAGED" | grep -q "^${f}$"; then
    MISSING+=("$f")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "" >&2
  echo "FORGE GATE BLOCKED: Missing required documentation files." >&2
  echo "The following files must be staged with every src/drizzle commit:" >&2
  for f in "${MISSING[@]}"; do
    echo "   - $f" >&2
  done
  echo "" >&2
  echo "Update these files, then stage and retry the commit." >&2
  echo "If no errata/patterns apply, add a 'No new errata' entry." >&2
  echo "" >&2
  exit 2
fi

exit 0
