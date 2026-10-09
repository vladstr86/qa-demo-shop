# QA Demo Shop

A static demo shop for manual QA and Playwright automation in JavaScript. Orders, login, and payments are simulated; there is no backend or real payment integration. The website supports Romanian and English. Project communication, instructions, documentation, code, and test names use English.

## Run locally

Use Node.js 24 LTS from the directory containing `package.json`; this is also the version used by GitHub Actions:

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

Playwright defaults to the public website at [https://vlad-qa-demo-shop.pages.dev/](https://vlad-qa-demo-shop.pages.dev/). It starts the local server for `dist/` only when the selected hostname is `localhost` or `127.0.0.1`. `npm start` serves the shop at `http://127.0.0.1:4173` for manual review. Use `npm run test:ui` for the test UI and `npm run report` for the HTML report.

To run both projects locally against the public website explicitly:

```bash
BASE_URL=https://vlad-qa-demo-shop.pages.dev/ npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

`BASE_URL` overrides the configured default. A deployed hostname disables the local web server; a local hostname starts it using the selected port. For example, run the local suite with `BASE_URL=http://127.0.0.1:4173 npm test`. The included server serves HTTP. A private environment may require a separately configured browser authentication state.

The public URL is already the default, so you can omit `BASE_URL`:

```bash
npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

## GitHub Actions

The workflow in `.github/workflows/playwright.yml` runs on push, pull request, and manual dispatch. It uses Ubuntu, Node.js 24, `npm ci`, and Chromium with system dependencies, then runs the existing desktop and mobile projects. Test failures keep the job failed. Available HTML reports and test results are uploaded even after failure and retained for 14 days.

The optional repository variable `BASE_URL` overrides the Playwright default. In GitHub, open **Settings → Secrets and variables → Actions → Variables → New repository variable**, enter `BASE_URL`, and set its value to an alternative website URL. Leave it unset or empty to use `https://vlad-qa-demo-shop.pages.dev/`. The configuration starts the local server only for `localhost` or `127.0.0.1`; deployed URLs do not start it.

Once this workflow exists on the GitHub repository's default branch, open **Actions → Playwright tests → Run workflow**, select a branch, and start the run. Open the completed run and download `playwright-report` and `test-results` from **Artifacts**. Extract the HTML report into a `playwright-report` folder and run `npm run report` to view it.

Keep `package-lock.json` in Git. The ignore rules exclude dependencies, generated reports, test results, local environment files, and authentication state. A safe `.env.example` remains eligible for Git; environment files are not loaded automatically by this project. No GitHub Actions result is claimed until an actual workflow run completes.

## Suite and data

The suite uses JavaScript ESM and Page Object Model. CSS locators and DOM interactions live in `pages/` and `components/`; assertions live in feature-based `tests/`. `fixtures/` isolates browser data, and `test-data/` holds immutable positive data, expected cents, and an independent currency parser/formatter.

Eight shared cases cover catalog/filter combinations, variants/gallery/images, cart mathematics, mock login, guest checkout, negative products, negative checkout, and bilingual/responsive behavior. Two desktop-only cases cover authenticated checkout and session/remember-me persistence. The mobile project excludes `*.desktop.spec.js` from discovery, giving 10 desktop + 8 mobile = 18 instances, with RO/EN inside cases. Viewports are 1440×900 and 390×844; mobile enables `isMobile` and `hasTouch`.

Fixed positive customer: Vlad Strut, `strutv@gmail.com`; shipping `Damrak, 70, Amsterdam, NL`; billing `221B Baker St, London, UK`. Dummy card: `4111 1111 1111 1111`, `12/39`, CVV `369`. Mock account: `demo@atelier.test` / `Demo123!`. Negative cases clone the valid data, invalidate one field, and restore it.

All prices are fixed EUR with exactly two decimals: RO `139,95 €`, EN `€139.95`. Calculations use integer cents. Standard shipping costs 300 cents; express costs 650 cents. The required cart exercise independently checks `79900 × 2 + 13995 × 3 = 201785` cents from displayed unit prices and quantities.

| Product or variant | Cents |
| --- | ---: |
| Atlas 14, 16 GB / 512 GB | 79900 |
| Atlas 14, 32 GB / 1 TB | 95950 |
| Horizon 16, 16 GB | 109950 |
| Horizon 16, 32 GB | 121975 |
| Pulse Pro wireless / wired | 13995 / 11995 |
| Wave Mini | 4990 |
| Studio Keyboard | 6900 |
| Mouse Precision | 3999 |

Catalog Pulse “From” pricing is 11995 cents; wireless selection costs 13995 cents. Image coverage checks all 45 PNG files, browser decoding, gallery thumbnails/zoom/navigation, radio-color exclusivity, and catalog `object-fit: cover`.

Syntax and discovery checks do not execute browser interactions. Actual verification and the thorough review are recorded in [qa/QA-001-r1-review.md](qa/QA-001-r1-review.md).

## Approved QA workflow

[AGENTS.md](AGENTS.md) contains permanent project rules. [qa/WORKFLOW.md](qa/WORKFLOW.md) describes the coordinator and approval process. Run `npm run qa:review` before applying an approved prompt. Its ID/revision and source/prompt fingerprints must match the exact user approval.

QA-001 r1 was approved for manual application in this conversation. Its original prompt stays unchanged to preserve its fingerprint. The manifest's prepared `pending` status belongs to the optional CLI handoff, not to a claim about manual implementation. No prompt has been dispatched to another Codex process or to VS Code.

The optional `npm run qa:apply` requires interactive exact-token approval and an installed, authenticated Codex CLI. It does not start a watcher or install the CLI. Test the handoff helper separately with `node --test scripts/qa-handoff.test.mjs`.

Website behavior/UI/asset changes require a read-only coordinator prompt and approval before the resulting implementation/test handoff. Test/documentation changes do not recursively trigger website prompts. No commit, push, merge, deploy, or real payments are authorized by this QA workflow.
