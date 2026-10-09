# Studio test failure investigation

The failed report was inspected on 2026-10-09. Its traces identify the actual target as `https://vlad-qa-demo-shop.pages.dev/`. The deployed website still serves the earlier implementation, while the tests enforce the approved Studio integration in the local working tree.

## Original failure report

| Project | Discovered | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| chromium-desktop | 10 | 6 | 4 | 0 |
| chromium-mobile | 8 | 4 | 4 | 0 |
| Total | 18 | 10 | 8 | 0 |

Four shared cases failed in both projects:

| Case | Recorded failure | Cause |
|---|---|---|
| Catalog | `[data-testid="hero-product-open"]` not found | The deployed version has the earlier hero without the approved Atlas action. |
| Product gallery | Expected `assets/products/1-1.jpg`; received `assets/products/1-1-black.png` | The deployed version still uses color-specific PNG illustrations. |
| Product validation | Expected the photograph source to remain unchanged; it changed from black PNG to red PNG | The older deployed swatch behavior conflicts with the approved fixed photographs. |
| Language | Loading `?lang=ro` retained English from storage | The deployed version lacks the approved query-language precedence and URL persistence. |

An independent tester confirmed all eight failures and their matching local implementations. A read-only browser comparison also confirmed the public hero is absent and its catalog uses PNG, while the local hero is present and its catalog uses JPEG. The failure report was preserved privately at `/tmp/qa-studio-failures-l3a77chm` before regenerating reports. Do not publish that original report or its traces without checking private parameters.

## Fix

Added `npm run test:local` through the JavaScript ESM runner `scripts/playwright-local.mjs`. It uses `http://127.0.0.1:4173/` by default, forwards Playwright CLI arguments, accepts local `BASE_URL` overrides, rejects deployed targets, and preserves the child process exit status.

Updated the README quickstart to use this command for unpublished changes. `npm test` and the existing Playwright/GitHub Actions deployed default remain unchanged. No website, POM, test assertions, fixed data, or test counts were changed to conceal the failures.

Files changed in this investigation:

- `package.json`: added `test:local`; retained all existing scripts/dependencies.
- `scripts/playwright-local.mjs`: new local runner.
- `README.md`: prominent local instructions and explanation of the deployed version mismatch.
- `qa/studio-failure-investigation.md`: this report.

## Verification

The existing QA fingerprint review passed before editing. Runner syntax passed. Discovery through the new command found 10 desktop and 8 mobile instances across the existing eight files. A local `BASE_URL=http://localhost:4195/` override was accepted during discovery, and a deployed override was rejected with exit code 1.

Actual E2E target: `http://127.0.0.1:4173/`.

Actual execution command:

```bash
PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/studio-results.json npm run test:local -- --project=chromium-desktop --project=chromium-mobile --workers=2 --reporter=line,html,json
```

| Project | Discovered | Passed | Failed | Skipped | Flaky | Not run |
|---|---:|---:|---:|---:|---:|---:|
| chromium-desktop | 10 | 10 | 0 | 0 | 0 | 0 |
| chromium-mobile | 8 | 8 | 0 | 0 | 0 | 0 |
| Total | 18 | 18 | 0 | 0 | 0 | 0 |

Execution exited 0 in 58.4 seconds; the JSON report has no top-level errors. Syntax/discovery checks are separate from these actual browser results.

Review endpoints:

- Store: <http://127.0.0.1:4173/>.
- Playwright HTML report: <http://127.0.0.1:9323/>.
- HTML artifact: `playwright-report/index.html`.
- JSON evidence: `test-results/studio-results.json`.

Private values were redacted only from generated HTML report step parameters. Test fixtures, assertions, outcomes, and counts were preserved. The embedded report was checked for remaining private-value matches after redaction.

All 15 files fingerprinted for preservation remained unchanged, including frontend, configuration, workflow, lockfile, loaders, and ignored personal fixtures. The existing staged patch also remained byte-for-byte identical. No commit, push, merge, or deployment was performed.

The public website mismatch remains until the approved Studio implementation is deployed through a separately authorized action. Running plain `npm test` against that older deployment can still fail these Studio requirements. Local success does not claim a public website or GitHub Actions pass.
