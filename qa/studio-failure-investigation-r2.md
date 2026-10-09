# Studio failure investigation — shared configuration fix

The report supplied at `http://localhost:41523/` was inspected directly on 2026-10-09, including its embedded results and all eight failure traces. The user then explicitly selected **local Studio as the default**, changing the earlier deployed-default requirement.

## Original evidence and cause

| Project | Discovered | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| chromium-desktop | 10 | 6 | 4 | 0 |
| chromium-mobile | 8 | 4 | 4 | 0 |

All eight traces recorded `https://vlad-qa-demo-shop.pages.dev/` as `baseURL`. Their network requests fetched the older application and color-specific PNG illustrations. Each project had the same four failures:

- Catalog: the approved Studio hero selector was missing.
- Product gallery: the test expected `1-1.jpg`, but the deployed gallery returned `1-1-black.png`.
- Product validation: selecting an unavailable color changed the photograph from a black PNG to a red PNG.
- Language: `?lang=ro` did not override the previously stored English language.

The existing local implementation already satisfies those requirements. Its served application, HTML, and Studio CSS were checked against the working-tree files and matched byte-for-byte.

The prior `test:local` helper only affected that optional npm command. Ordinary `npm test`, headed/UI commands, direct Playwright commands, and VS Code's Playwright Testing panel bypassed it and continued reading the deployed default from the shared configuration. This was the recurrence mechanism. Missing selectors and mismatched image sources were deterministic version differences; increasing timeouts or weakening assertions would not fix them.

The supplied report and trace attachments were preserved privately under `/tmp/qa-report-41523/`. Configuration and staged-change preservation records are under `/tmp/qa-41523-before-w308d2hk`.

## Fix applied

- `playwright.config.js`: changed the shared default to `http://127.0.0.1:4173/`, as explicitly selected by the user. Preserved `BASE_URL`, local-only server startup, selected port, server reuse, and the existing projects/viewports. Added safe target URL/type metadata to future reports.
- `.github/workflows/playwright.yml`: made its existing public fallback explicit with `${{ vars.BASE_URL || 'https://vlad-qa-demo-shop.pages.dev/' }}`. This preserves the earlier GitHub Actions target behavior independently of the new development default.
- `README.md`: corrected ordinary npm/GUI/VS Code instructions, explicit public targeting, environment-override behavior, and CI documentation.
- `qa/studio-failure-investigation-r2.md`: recorded this investigation and actual results.
- `qa/prompts/QA-005-STUDIO-INTEGRATION-r2.md`, `qa/.handoff-records/QA-005-r2.json`, and `qa/latest.json`: prepared a pending coordinator revision because r1's deployed-default requirement was superseded. Historical prompts remain unchanged.

No website, Page Object, test specification, assertion, fixture, package dependency, or test count was changed in this fix.

## Deep verification

An independent tester verified these selections by importing the configuration:

| Environment | Selected target | Local server |
|---|---|---|
| `BASE_URL` unset | `http://127.0.0.1:4173/` | Enabled |
| `BASE_URL` empty | `http://127.0.0.1:4173/` | Enabled |
| Custom `http://localhost:4287/review/` | Exact override | Enabled, port 4287 |
| Explicit public URL | Exact override | Disabled |

Configuration syntax and workflow YAML parsing passed. Discovery through ordinary `npm test` found 10 desktop and 8 mobile instances across eight files. The installed VS Code Playwright extension reads the same shared configuration; no separate configuration or duplicated projects were added.

The suite was first verified locally using the same four-worker concurrency as the supplied failed run. After changing the shared default, it was run again through ordinary `npm test` with **no `BASE_URL` override**. The final report confirms:

```json
{
  "targetURL": "http://127.0.0.1:4173/",
  "targetType": "local",
  "actualWorkers": 4
}
```

| Project | Discovered | Passed | Failed | Skipped | Flaky | Not run |
|---|---:|---:|---:|---:|---:|---:|
| chromium-desktop | 10 | 10 | 0 | 0 | 0 | 0 |
| chromium-mobile | 8 | 8 | 0 | 0 | 0 | 0 |
| Total | 18 | 18 | 0 | 0 | 0 | 0 |

The final execution exited 0 in 56.0 seconds. Its JSON report has no top-level errors. This is an actual E2E result, separate from syntax, discovery, and configuration checks.

Actual final command:

```bash
PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/studio-results.json npm test -- --project=chromium-desktop --project=chromium-mobile --workers=4 --reporter=line,html,json
```

Simple rerun command:

```bash
npm test -- --project=chromium-desktop --project=chromium-mobile --workers=4
```

If the current shell explicitly exports another `BASE_URL`, unset it to use the selected default:

```bash
env -u BASE_URL npm test -- --project=chromium-desktop --project=chromium-mobile --workers=4
```

## Review and remaining limits

- Preview: <http://127.0.0.1:4173/>.
- Updated HTML report, on the supplied port: <http://localhost:41523/>.
- Alternative report endpoint: <http://127.0.0.1:9323/>.
- HTML artifact: `playwright-report/index.html`.
- JSON evidence: `test-results/studio-results.json`.

Both report endpoints were checked in Chromium: each rendered all 18 passing results with no page errors. Refresh an already open report tab to load the new run. Private fixture values were redacted from generated report step parameters only; outcomes and test behavior were unchanged, and the embedded report was checked after redaction.

Refresh Playwright test discovery in VS Code after the configuration change. An inherited explicit deployed `BASE_URL` still takes precedence; unset it or supply the local URL in that environment. No additional VS Code setting is needed when the environment has no override.

The public website still serves the older version. An explicitly targeted public run or CI's preserved public fallback can still fail Studio requirements until a separately authorized deployment occurs. No deployed or GitHub Actions pass is claimed.

The read-only coordinator prepared [QA-005 r2](prompts/QA-005-STUDIO-INTEGRATION-r2.md). It remains pending for any future handoff application; the current configuration fix was directly authorized by the user's target choice. The website fingerprint and historical prompts are unchanged.

Original staged changes, ignored personal fixtures, source assets, and unrelated modifications were preserved. No commit, push, merge, deployment, Git history rewrite, global Git change, or SSH change was performed.
