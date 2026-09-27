---
description: Run the full quality gate (lint, formatting, types, unit tests, build, e2e + a11y)
---

Run these in order from the repository root and stop at the first failure, reporting the failing output verbatim:

1. `npm run lint:eslint`
2. `npm run format:check`
3. `npm run typecheck`
4. `npm run test:unit`
5. `npm run build`
6. `npm run perf:bundles` — include the table in the report
7. `npm run test:e2e`

Summarize: which steps passed, bundle sizes per route, and any failures with file:line.
