# Private test-data separation review

Date: 2026-10-09. Project: `/home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop`.

## Result

Public fixtures now use immutable fictional defaults. Ignored local files preserve the existing private customer, payment, and mock-login values. JavaScript ESM, Page Object Model, CSS locators, fixed price data, negative-copy behavior, and the bilingual website remain intact. No Playwright cases were added.

The public facade is `test-data/shop-data.js`. Its loader takes environment overrides first, then optional `test-data/shop.local.json`, or legacy `test-data/shop.js` when JSON is absent, and fictional defaults for remaining fields. Existing malformed private files fail with value-free errors. CI and `QA_USE_LOCAL_TEST_DATA=0` skip both local fixture sources. An empty login pair uses the selected demo site's advertised mock account through the account POM.

The site uses fictional `dist/demo.example.json`, with optional ignored `dist/demo.local.json` preserving its original local account. Startup completes before the POM continues navigation or reload. The deployed website was not changed.

## Tracking and privacy

`git rm --cached` removed these files from the index while retaining their local contents unchanged:

- `test-data/shop.js` — SHA-256 `f249f0cbbac35631c2c28d5d9ce16cf8f2673502272219475393d3dcfbeef937`.
- `qa/prompts/QA-001-EUR.md` — SHA-256 `f3b294b17825c6b8e01aa78fc8defb86c9cab3c2df2deb512f331d3b0d4c0bab`.

The ignore rules cover both originals, local JSON overrides, environment files, authentication state, dependencies, and generated reports. Fictional examples and the lockfile remain eligible for Git. README contains no literal customer details, payment values, or credentials. Credential copies were also removed from AGENTS, PROJECT, Node checks, and the website code.

The final Git-eligible working files and reviewed index contents were scanned for all original private fixture strings; none remained. The reviewed privacy changes, examples, supporting public files, and two removals are staged without creating a commit. The pre-existing README cleanup is preserved. Git history still contains prior versions; this work does not rewrite history or claim retroactive removal.

## Verification

Before the website refactor, `npm run qa:review` successfully validated the historical approved QA-001 r1 record. A read-only coordinator reviewed the site refactor, and privacy-safe QA-002 r1 was prepared as a pending follow-up. It has not been dispatched or separately applied. Public fingerprints exclude only ZIP archives and the ignored local demo configuration; fictional configuration remains fingerprinted.

- Syntax checks and `git diff --check` passed.
- Node helper checks: **22 passed, 0 failed, 0 skipped**. These are separate from browser E2E.
- Discovery: **10 chromium-desktop + 8 chromium-mobile = 18**, without additional projects or skipped mobile instances.

| Executed target and data mode | Desktop passed/failed/skipped | Mobile passed/failed/skipped | Duration |
| --- | --- | --- | --- |
| `https://vlad-qa-demo-shop.pages.dev/`, fictional public snapshot, `CI=true`, empty `BASE_URL` | 10 / 0 / 0 | 8 / 0 / 0 | 83.5 s |
| `http://127.0.0.1:4174`, preserved private fixtures and local demo configuration | 10 / 0 / 0 | 8 / 0 / 0 | 93.2 s |
| `http://127.0.0.1:4175`, fictional public snapshot without ignored files | 10 / 0 / 0 | 8 / 0 / 0 | 92.9 s |

All three browser processes exited successfully, with zero flaky results. The public-source snapshot physically omitted the private fixtures, local demo configuration, and original approval prompt. It reused the installed dependency directory; it was not an actual Git clone or a GitHub workflow run.

Automatic approval review rejected submitting preserved personal fixtures to the deployed website because it did not find authorization for the sensitive external payload. That run was not executed. The safe alternatives above verify fictional data on the public site and preserved private data only on localhost. There are no unresolved failures in the executed suites.

Re-run public browser tests without loading private fixtures:

```bash
QA_USE_LOCAL_TEST_DATA=0 BASE_URL=https://vlad-qa-demo-shop.pages.dev/ PLAYWRIGHT_HTML_OPEN=never npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

Re-run the preserved local data against the local site:

```bash
BASE_URL=http://127.0.0.1:4173 PLAYWRIGHT_HTML_OPEN=never npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

Current branch: `main`. Remote: `origin`, `https://github.com/vladstr86/qa-demo-shop.git` for fetch and push. No commit, push, merge, deployment, global Git/SSH change, or history rewrite was performed. No GitHub Actions success is claimed.
