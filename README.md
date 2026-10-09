# QA Demo Shop

A static demo shop for manual QA and Playwright automation in JavaScript. Orders, login, and payments are simulated; there is no backend or real payment integration. The website supports Romanian and English. Project communication, instructions, documentation, code, and test names use English.

## Install and test local changes

Use Node.js 24 LTS from the directory containing `package.json`; this is also the version used by GitHub Actions:

```bash
npm ci
npx playwright install --with-deps chromium
npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

`npm run test:local` tests the working-tree website at `http://127.0.0.1:4173/`, using the existing Playwright configuration and automatic local server. It forwards Playwright arguments and accepts a local `BASE_URL` override, such as `BASE_URL=http://localhost:4195/ npm run test:local`. It rejects deployed URLs to prevent accidental testing of an older deployment.

Plain `npm test`, `npm run test:ui`, `npm run test:headed`, direct Playwright commands, and VS Code's Playwright Testing panel now default to the local Studio website at `http://127.0.0.1:4173/`. Playwright starts the local server for `dist/` only when the selected hostname is `localhost` or `127.0.0.1`. `npm start` serves the shop at the same address for manual review. Use `npm run report` for the HTML report; report metadata records the selected target URL and whether it is local or deployed.

`BASE_URL` still overrides the target. If a terminal or VS Code environment exports a deployed `BASE_URL`, unset it for local testing or set `BASE_URL=http://127.0.0.1:4173/` explicitly. Reload the Playwright tests in VS Code after changing configuration. Unpublished Studio changes must be verified against the local site; the deployed website still has the older theme until a separate deployment occurs.

## Test the deployed website

To run both projects locally against the public website explicitly:

```bash
BASE_URL=https://vlad-qa-demo-shop.pages.dev/ npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

`BASE_URL` overrides the configured default. A deployed hostname disables the local web server; a local hostname starts it using the selected port. For example, run the local suite with `BASE_URL=http://127.0.0.1:4173 npm test`. The included server serves HTTP. A private environment may require a separately configured browser authentication state.

The live website is [https://vlad-qa-demo-shop.pages.dev/](https://vlad-qa-demo-shop.pages.dev/). It is an explicit test target. Until Studio is deployed there, its older hero, PNG images, and language behavior will fail the current Studio assertions.

## GitHub Actions

The workflow in `.github/workflows/playwright.yml` runs on push, pull request, and manual dispatch. It uses Ubuntu, Node.js 24, `npm ci`, and Chromium with system dependencies, then runs the existing desktop and mobile projects. Test failures keep the job failed. Available HTML reports and test results are uploaded even after failure and retained for 14 days.

The optional repository variable `BASE_URL` overrides the workflow target. In GitHub, open **Settings → Secrets and variables → Actions → Variables → New repository variable**, enter `BASE_URL`, and set its value to an alternative website URL. Leave it unset or empty to use `https://vlad-qa-demo-shop.pages.dev/`: the workflow sets this public fallback explicitly, preserving its existing behavior despite the local development default. The configuration starts the local server only for `localhost` or `127.0.0.1`; deployed URLs do not start it. The selected deployed website must include Studio for the current Studio tests to pass.

Once this workflow exists on the GitHub repository's default branch, open **Actions → Playwright tests → Run workflow**, select a branch, and start the run. Open the completed run and download `playwright-report` and `test-results` from **Artifacts**. Extract the HTML report into a `playwright-report` folder and run `npm run report` to view it.

Keep `package-lock.json` in Git. The ignore rules exclude dependencies, generated reports, test results, local environment files, and authentication state. A safe `.env.example` remains eligible for Git; environment files are not loaded automatically by this project. No GitHub Actions result is claimed until an actual workflow run completes.

## Suite and data

The suite uses JavaScript ESM and Page Object Model. CSS locators and DOM interactions live in `pages/` and `components/`; assertions live in feature-based `tests/`. `fixtures/` isolates browser data, and `test-data/` holds immutable positive data, expected cents, and an independent currency parser/formatter.

Eight shared cases cover catalog/filter combinations, variants/gallery/images, cart mathematics, mock login, guest checkout, negative products, negative checkout, and bilingual/responsive behavior. Two desktop-only cases cover authenticated checkout and session/remember-me persistence. The mobile project excludes `*.desktop.spec.js` from discovery, giving 10 desktop + 8 mobile = 18 instances, with RO/EN inside cases. Viewports are 1440×900 and 390×844; mobile enables `isMobile` and `hasTouch`.

Fresh checkouts and GitHub Actions use fixed fictional customer/payment defaults from `test-data/shop.example.json`. When no login override is supplied, the account POM reads the demo account advertised by the selected website. Negative cases copy valid fixture data, invalidate one field, and restore it without modifying the shared fixture.

For private local data, copy the fictional template and edit the ignored copy:

```bash
cp test-data/shop.example.json test-data/shop.local.json
```

The loader in `test-data/shop-data.js` uses the JSON override first, then the ignored legacy `test-data/shop.js` if present, then fictional defaults. Local files can override complete groups or individual fields. `CI=true` skips both private files; set `QA_USE_LOCAL_TEST_DATA=0` to exercise the same fallback locally. Environment overrides take precedence: `QA_CUSTOMER_NAME`, `QA_CUSTOMER_EMAIL`, `QA_CUSTOMER_ADDRESS`, `QA_CUSTOMER_BILLING`, `QA_CARD_NUMBER`, `QA_CARD_EXPIRY`, `QA_CARD_CVV`, and the pair `QA_LOGIN_EMAIL` / `QA_LOGIN_PASSWORD`. Environment files are not loaded automatically; export variables in your shell. Keep actual values out of documentation, commits, and shared test reports.

For the local website, `dist/demo.example.json` supplies a fictional demo account; an optional ignored `dist/demo.local.json` overrides it. These are simulated credentials displayed by the demo UI. No ignored file is needed to run the site or tests after a fresh clone.

The separation and actual browser results are recorded in [qa/private-data-review.md](qa/private-data-review.md). To run the public site with fictional defaults even when private files exist locally:

```bash
BASE_URL=https://vlad-qa-demo-shop.pages.dev/ QA_USE_LOCAL_TEST_DATA=0 PLAYWRIGHT_HTML_OPEN=never npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

Prices use EUR with exactly two decimal places and locale-specific formatting. Calculations use integer cents. Cart and checkout tests independently recalculate expected amounts from displayed unit prices and quantities.

The approved Studio theme uses white, graphite, and sage with 18 real photographs: three distinct views for each product. Color swatches change variant prices and availability without changing the photographs. Image coverage checks JPEG responses and browser decoding, gallery thumbnails/zoom/navigation, radio-color exclusivity, and catalog `object-fit: cover`. Attribution and license links are available in the bilingual [photo credits page](dist/photo-credits.html), [PHOTO-CREDITS.md](PHOTO-CREDITS.md), and [photo-sources.json](photo-sources.json).

Validate unpublished website changes against the local site, rather than the deployed URL:

```bash
PLAYWRIGHT_HTML_OPEN=never npm run test:local -- --project=chromium-desktop --project=chromium-mobile --workers=2
npm run report
```

Run `npm start` to review the integrated Studio site at `http://127.0.0.1:4173/`. The Atlas hero opens its product dialog; the analytics link forwards the active language. Language changes persist in the URL and browser storage, including after a reload. The public deployment remains available through an explicit `BASE_URL` override.

Syntax and discovery checks do not execute browser interactions. Actual verification and the thorough review are recorded in [qa/QA-001-r1-review.md](qa/QA-001-r1-review.md).

## Approved QA workflow

[AGENTS.md](AGENTS.md) contains permanent project rules. [qa/WORKFLOW.md](qa/WORKFLOW.md) describes the coordinator and approval process. Run `npm run qa:review` before applying an approved prompt. Its ID/revision and source/prompt fingerprints must match the exact user approval.

QA-001 r1 was approved for manual application in this conversation. Its original prompt is preserved unchanged in an ignored local file because it contains private test values; it is no longer part of the public checkout. New privacy-safe coordinator prompts remain tracked. The manifest's prepared `pending` status belongs to the optional CLI handoff, not to a claim about manual implementation. No prompt has been dispatched to another Codex process or to VS Code.

The optional `npm run qa:apply` requires interactive exact-token approval and an installed, authenticated Codex CLI. It does not start a watcher or install the CLI. Test the handoff helper separately with `node --test scripts/qa-handoff.test.mjs`.

Website behavior/UI/asset changes require a read-only coordinator prompt and approval before the resulting implementation/test handoff. Test/documentation changes do not recursively trigger website prompts. No commit, push, merge, deploy, or real payments are authorized by this QA workflow.
