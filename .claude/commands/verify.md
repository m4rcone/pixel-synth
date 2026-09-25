---
description: Run the full quality gate (lint, types, unit tests, build, a11y)
---

Run these in order from the repository root and stop at the first failure, reporting the failing output verbatim:

1. `npm run lint:eslint`
2. `npx tsc --noEmit`
3. `npm run test:unit`
4. `npm run build`
5. `npm run perf:bundles` — include the table in the report
6. `npm run test:a11y`

Summarize: which steps passed, bundle sizes per route, and any failures with file:line.
