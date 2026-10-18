#!/usr/bin/env bash
# Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
# Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
# Runs one CI step. If it fails, the end of its output is attached to the run as annotations
# (split into pieces, since each annotation is short), so the failure can be read from the
# GitHub API without downloading the log.
#   bash scripts/ci-step.sh "Lint" npm run lint
set -o pipefail
name="$1"; shift
log="$(mktemp)"
"$@" 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
if [ "$status" -ne 0 ]; then
  sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$log" | tail -c 24000 | python3 -c '
import sys
text = sys.stdin.read()
size = 3000
parts = [text[i:i + size] for i in range(0, len(text), size)][-8:]
for n, part in enumerate(parts, 1):
    body = part.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::error title={sys.argv[1]} failed ({n} of {len(parts)})::{body}")
' "$name"
fi
exit "$status"
