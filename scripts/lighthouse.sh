#!/usr/bin/env bash
# Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
# Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
# Measures public pages with Lighthouse (phone settings) and reports each page's scores, and the
# checks it did not pass, as notices on the CI run. Needs a production build and a database.
set -u
PORT=3200
npm run start -- -p "$PORT" > /tmp/next-lighthouse.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
for _ in $(seq 1 60); do curl -sf "http://localhost:$PORT/" > /dev/null && break; sleep 1; done

CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")"
export CHROME_PATH

for path in / /funds /council /projects /privacy; do
  out="/tmp/lighthouse$(echo "$path" | tr '/' '_').json"
  npx --yes lighthouse@12 "http://localhost:$PORT$path" --quiet \
    --chrome-flags="--headless=new --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path="$out" || continue
  node -e '
    const r = require(process.argv[1]);
    const s = Object.values(r.categories).map((c) => `${c.title} ${Math.round(c.score * 100)}`).join(" · ");
    const failing = Object.values(r.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && !["manual", "notApplicable", "informative"].includes(a.scoreDisplayMode))
      .map((a) => `${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
    const body = `${s}%0A${failing.length ? "Not passing:%0A- " + failing.join("%0A- ") : "Every check passed."}`;
    console.log(`::notice title=Lighthouse ${process.argv[2]}::${body.replace(/\n/g, "%0A")}`);
  ' "$out" "$path"
done
