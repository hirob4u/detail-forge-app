#!/usr/bin/env bash
# Pre-commit gate: ensures build-log, errata, and forge patterns are staged.
# Skips check for commits that only touch docs/config/scripts (no src changes).

set -euo pipefail

REQUIRED_FILES=(
  "docs/build-log.md"
  "docs/blueprint-errata.md"
  "forge/patterns.md"
)

# Get list of staged files
STAGED=$(git diff --cached --name-only 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

# Skip check if no src/ files are staged (docs-only, config-only, scripts-only)
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
  echo ""
  echo "⚠️  FORGE GATE: The following required files are not staged:"
  for f in "${MISSING[@]}"; do
    echo "   - $f"
  done
  echo ""
  echo "Every PR that touches src/ or drizzle/ must update ALL THREE:"
  echo "   1. docs/build-log.md      (what was built)"
  echo "   2. docs/blueprint-errata.md (lessons learned)"
  echo "   3. forge/patterns.md      (forward-looking warnings)"
  echo ""
  echo "If this commit genuinely has no errata/patterns to add,"
  echo "add a 'No new errata' or 'No new patterns' note to the file."
  echo ""
  exit 1
fi
