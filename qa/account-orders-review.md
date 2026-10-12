# Account and order integration review

Implemented on 2026-10-12 from the supplied account/order reference package. The project manager coordinated preservation and delivery; frontend/backend developers integrated the feature; the tester adapted existing cases; the read-only coordinator reviewed the resulting source. The user performs final review. No live Supabase changes, user creation, order writes, commit, push, merge, or deployment were performed.

## Integration and preserved behavior

- Verified all seven supplied manifest entries and passed the existing QA-005 r2 gate before editing.
- Preserved the approved Studio theme, all 18 photograph bytes and credits, product IDs/prices/availability, gallery, analytics anchor/language URLs, existing selectors, and private fixtures.
- Retained the local Playwright default, environment override, desktop/mobile settings, and existing CI public fallback.
- Added a locally bundled, pinned official Supabase SDK with licenses. No CDN or elevated key is used.
- Added bilingual registration, confirmation feedback, sign-in/out, contact profiles, separate structured addresses, account order history, and aggregate refresh.
- Preserved the old mock login/session behavior as an explicitly separate mode. Guest/mock checkout remains local and calls neither order RPC.
- Added editable account checkout prefill, phone/address validation, stable UUID/payload retries, duplicate prevention, server-confirmation reconciliation, and truthful failure handling. Cart clears only after validated account success.
- Card number, expiry, CVV, password, client-set owner/email, price, source, and status are excluded from account order payloads. Payments/delivery remain simulated.
- Added session-token pinning and owner/generation checks so delayed responses cannot act on a newer account. Logout follows the official SDK's actual local-memory clearing behavior even when remote revocation cannot be confirmed.
- Added an additive migration with owner RLS, authenticated order/history RPCs, immutable snapshots, strict five-field addresses, legacy anonymous-order revocation, and preserved aggregate filters.

The tracked account configuration is empty. Real account submissions are disabled with a bilingual explanation until the user reviews/configures the project. This is independent implementation work, not a claim of live Auth readiness.

## Changed files

Frontend and SDK:

- `dist/app.js`, `dist/index.html`
- `dist/account-ui.mjs`, `dist/account-client.mjs`, `dist/account-runtime.mjs`
- `dist/account.css`, `dist/account-config.example.json`
- `dist/vendor/supabase.js`, `dist/vendor/SUPABASE-LICENSE.txt`, `dist/vendor/THIRD-PARTY-LICENSES.txt`
- `package.json`, `package-lock.json`
- `scripts/build-account-sdk.mjs`, `scripts/serve.mjs`

Database and verification:

- `database/migrations/001-account-orders.sql`
- `database/review-preflight.sql`, `database/test-baseline.sql`
- `scripts/validate-account-database.mjs`, `scripts/account-client.test.mjs`
- `fixtures/account-api.js`, `fixtures/shop.js`
- `pages/AccountPage.js`, `pages/CheckoutPage.js`
- `tests/auth/auth.spec.js`, `tests/auth/session.desktop.spec.js`
- `tests/checkout/checkout.spec.js`, `tests/checkout/authenticated.desktop.spec.js`

Documentation and QA:

- `.gitignore`, `README.md`, `PROJECT.md`, `qa/WORKFLOW.md`
- `scripts/qa-handoff.mjs`, `scripts/qa-handoff.test.mjs`
- `qa/account-orders-configuration.md`, `qa/account-orders-review.md`
- `qa/prompts/QA-006-ACCOUNT-ORDERS.md`, `qa/.handoff-records/QA-006-r1.json`, `qa/latest.json`

Existing test-data loaders/examples, ignored personal data, photo assets, historical prompts, and configuration outside this scope remain intact. The original Git index was preserved. The source backup is `/tmp/qa-account-orders-before-bmlzlk58`.

## Actual verification

| Check | Actual result | Scope |
|---|---|---|
| Reference manifest | 7 entries matched | Supplied package integrity |
| Syntax and discovery | Passed; 10 desktop + 8 mobile | Separate from E2E |
| SDK unit tests | 13 passed, 0 failed, 0 skipped | Injected offline contracts, token pinning, validation, payload/response checks |
| Local database | 12 named groups passed | Disposable PGlite compatibility harness; all 27 current variants compared |
| QA handoff helpers | 9 passed, 0 failed, 0 skipped | Gate integrity and ignored configuration exclusion |
| Focused security regressions | 2 desktop instances passed | Failed local logout/reset and delayed owner A responses after owner B signs in |

Final E2E target: `http://127.0.0.1:4173/`. The suite mocks configuration, Supabase Auth, profiles, orders, and aggregate requests before navigation, including additional browser contexts. It creates no live users or orders.

| Project | Discovered | Passed | Failed | Skipped | Flaky | Not run |
|---|---:|---:|---:|---:|---:|---:|
| chromium-desktop | 10 | 10 | 0 | 0 | 0 | 0 |
| chromium-mobile | 8 | 8 | 0 | 0 | 0 | 0 |
| Total | 18 | 18 | 0 | 0 | 0 | 0 |

The final execution exited 0 in 73.7 seconds with no top-level JSON report errors. Existing positive/negative flows and independent integer-cent EUR calculations remain covered; no additional Playwright cases or skips were introduced.

The initial full run had 15 passes and 3 failures. Investigation corrected the registration POM action and an explicit history-refresh expectation. Focused verification then exposed the SDK's actual local logout behavior; the warning and regression now follow it. Independent review identified and fixed stale-session error handling. The final full run above is the result after those corrections, without weakened assertions.

Actual final command:

```bash
PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/account-orders-results.json npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2 --reporter=line,html,json
```

The final SQL-only hidden-address-key rejection was followed by another successful 12-group database run. Frontend source was unchanged after the final E2E execution.

## Preview and report

- Local preview: <http://127.0.0.1:4173/>.
- HTML report: <http://127.0.0.1:9323/>.
- HTML artifact: `playwright-report/index.html`.
- JSON evidence: `test-results/account-orders-results.json`.
- Fictional-account screenshots/layout measurements: `test-results/manual-account-orders/`.

The preview/report servers are running. Restart with `npm start` and `npm run report -- --host 127.0.0.1 --port 9323` if the local session ends. Mocked account previews were inspected at 1440, 390, and 320 pixels: no horizontal overflow, contained dialogs, visible keyboard focus, and no page errors. Screenshots show fictional data only. The normal preview deliberately keeps real Auth disabled until configuration review.

Private fixture values were redacted from generated report API-step parameters only. Test outcomes, fixtures, assertions, and behavior were preserved. The embedded report was checked afterward with no remaining private-value matches. Generated artifacts remain ignored; Git-eligible content was checked without logging private values and had no matches.

## SQL/configuration review and unresolved dependencies

Read [account-orders-configuration.md](account-orders-configuration.md) for the prepared preflight queries, additive migration, account configuration, proposed email-confirmation policy, Site URL and exact local/production redirects.

The original database baseline, actual Supabase project URL/publishable key, production catalog/grants, and Auth settings were not supplied or present in the checkout. The database harness reconstructs the compatibility contract; it cannot verify the unknown live schema. PGlite queues one connection, so multi-connection PostgreSQL locking/concurrency remains unverified. Run reviewed checks against the actual baseline in an authorized disposable environment before considering any live migration.

Live email delivery, real Auth/session refresh behavior, live order persistence, remote dashboard refresh, and GitHub Actions were not verified. The separate hosted analytics source was preserved rather than replaced; the store's aggregate refresh is tested locally with mocks. Existing historical observed records may include legacy anonymous submissions; authenticated ownership is not claimed for them.

The read-only coordinator independently reviewed syntax, source contracts, discovery, and the actual final JSON results. [QA-006 r1](prompts/QA-006-ACCOUNT-ORDERS.md) is prepared with current fingerprints and remains **pending** for any future handoff application. It has not been dispatched or approved as a separate prompt. The current feature implementation follows the user's direct request.
