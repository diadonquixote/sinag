#!/usr/bin/env bash
# Runs one CI step. If it fails, the end of its output is attached to the run as an
# annotation, so the failure can be read from the GitHub API without downloading the log.
#   bash scripts/ci-step.sh "Lint" npm run lint
set -o pipefail
name="$1"; shift
log="$(mktemp)"
"$@" 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
if [ "$status" -ne 0 ]; then
  sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$log" | tail -n 120 | tail -c 30000 | python3 -c '
import sys
text = sys.stdin.read().replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
print(f"::error title={sys.argv[1]} failed::{text}")
' "$name"
fi
exit "$status"
