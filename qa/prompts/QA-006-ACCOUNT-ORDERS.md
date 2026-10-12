# QA-006 r1 — Account, profile and stored-order integration

Status: pending  
Language: English  
Project: `/home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop`

## Authorization and verified source

This is the follow-up QA handoff for the directly authorized account/orders integration from `/home/vlad/ProjectDemo/account-orders-reference/IMPLEMENTATION-PROMPT.md`.

The current user authorization covers local implementation and verification. It does not approve or dispatch this separately prepared QA-006 r1 prompt, apply a live migration, create live users/orders, or authorize publication.

Before future application or dispatch, obtain explicit approval of **QA-006 r1**, run `npm run qa:review`, and verify the exact ID/revision and matching fingerprints. If requirements or analyzed source differ, prepare a new revision. Preserve historical prompts unchanged.

Reviewed Git HEAD:

`246ccc38551c26d356c320731e388bad9a7aa6a5`

Reviewed public `dist/` fingerprint:

`c2e68202769e2a3bf7e5a9c7f539aa485bb9f606d5437f88c89b7e15aaced2a6`

Reviewed source SHA-256:

- `dist/app.js`: `0bc0c6aca4369a93baa1c30a62abeb0fd547a2c27987ae9c881fef25b7c0b11a`
- `dist/index.html`: `4495168c56ede870a2801dc241a7d5434316490a7fce2ebdf39bc8781973649e`
- `dist/account-client.mjs`: `0064898217ab7ac4809a9ddf91014b7edeadd15e6398bdc188033120f3196d19`
- `dist/account-runtime.mjs`: `477cb742f5c415534d1ef070df3785792ae0b8109ab726793273bc98606b98b5`
- `dist/account-ui.mjs`: `f5817a46214be0f8701ff0ccbd140073738c60ffc469c9773c5b2c486fd6c8a4`
- `database/migrations/001-account-orders.sql`: `3e4a34f26dc5bcf291e02d1e6c1632d1c1fe63bc9a85939d618a3bf2956a83a0`

The main agent reported successful pre-edit QA-005 r2 validation, verification of seven reference manifest entries, and a preservation backup at `/tmp/qa-account-orders-before-bmlzlk58`.

Preparation must calculate the current public-source fingerprint. The manifest does not fingerprint SQL outside `dist/`; additionally compare the reviewed migration hash and concrete database diff.

## Scope and preservation

Review, retain, and synchronize the existing integration. Correct concrete defects within this scope without replacing the project or importing an archived suite.

Frontend:

- `dist/account-client.mjs`
- `dist/account-runtime.mjs`
- `dist/account-ui.mjs`
- `dist/account.css`
- `dist/account-config.example.json`
- Minimal hooks in `dist/app.js` and `dist/index.html`
- Locally bundled `dist/vendor/supabase.js` and its license files

Database and configuration review:

- `database/migrations/001-account-orders.sql`
- `database/review-preflight.sql`
- `database/test-baseline.sql`
- `qa/account-orders-configuration.md`

Verification and supporting changes:

- `fixtures/account-api.js`, `fixtures/shop.js`
- `pages/AccountPage.js`, `pages/CheckoutPage.js`
- Existing authentication and checkout specifications
- SDK build/unit and disposable database validation scripts
- Reviewed dependency/lockfile changes, `.mjs` server MIME support, configuration ignore rule, and QA fingerprint exclusion

Preserve the approved Studio design, all 18 unchanged photographs and licenses, six product IDs, fixed prices/stock rules, gallery behavior, analytics navigation, existing selectors, unrelated changes, and ignored personal fixtures.

Preserve the local Playwright default `http://127.0.0.1:4173/`, `BASE_URL` override, local-host-only webServer, and explicit public fallback in GitHub Actions. Do not validate unpublished changes against the older deployment.

Keep JavaScript ESM and the existing npm commands. Use English for technical work; retain Romanian/English UI translations and localized assertions.

## Auth and explicit modes

Keep two clearly labeled modes:

- Guest/mock authentication and orders remain local.
- Configured Supabase accounts use Auth and the authenticated order RPC.

Never treat mock login as real Auth or silently convert a failed database request into mock success.

Without valid configuration, display a bilingual explanation and disable real account submission while keeping mock functionality available. The tracked configuration contains empty placeholders. Preserve the ignored local configuration file; never put service-role keys, secret keys, database passwords, sessions, or customer data in frontend configuration.

Retain the pinned official SDK and memory policy:

- `persistSession: false`
- `autoRefreshToken: true`
- `detectSessionInUrl: false`

Reload requires real-account sign-in again. Existing mock remember-me behavior remains separate.

Registration must validate inputs, preserve non-secret fields on failure, handle duplicate/obfuscated responses without claiming account existence, and explain confirmation-required signup without presenting an authenticated session.

Login/logout must preserve cart and language. Clear protected profile, draft, and order state when authentication ends or changes. A failed remote sign-out must follow the SDK’s actual local-session result and display an accurate warning; do not claim confirmed server revocation or apply an unconfirmed reset.

Pin protected requests to their verified session token. Check owner/generation before handling delayed errors or rendering their results. A delayed 401 from account A must not sign out, overwrite, or display protected data for account B. Apply equivalent context checks to profile, order, and analytics requests.

## Profiles and checkout

Keep authenticated contact editing for:

- Full name
- Read-only Auth email
- Required phone
- Separate street, house number, city, postal code, and country fields
- Optional different billing address

Preserve matching client/server validation and canonical structured-address serialization. Normalize phone numbers consistently. Addresses must contain exactly the five permitted fields; reject malformed server input and additional hidden fields, including card-related keys.

Profile/address saves are separate writes. Display partial-save failure accurately and preserve retryable input; do not describe them as one atomic operation.

Prefill account checkout from saved contact/address values and permit checkout overrides. Keep the three steps, optional newsletter, required terms, shipping choices, and simulated cash/card validation.

Never include card number, expiry, CVV, password, client-set owner/email, price, source, or status in order requests. Payments and delivery remain simulated.

## Order ownership, retry and confirmation

Use `qa_demo_place_authenticated_order` with the reviewed UUID/contact/items/shipping contract.

The server derives ownership from `auth.uid()` and email from trusted Auth records. Keep owner RLS on profile/address tables, constrained authenticated history, qualified names, safe search paths, intended grants, and private raw order/customer tables.

Retain server catalog, availability, quantity, duplicate-line, shipping, and integer-cent validation. Order headers/items and ownership/snapshots must commit transactionally.

Retain one immutable request UUID and identical payload across retries. Changed order data or owner requires a new UUID. Same UUID with a conflicting owner/payload must not return another owner’s order.

Disable duplicate submission while pending. Clear cart and show stored-order success only after a valid response matches the request UUID, EUR currency, and independently expected subtotal/shipping/total cents.

Network failure, lost response, malformed confirmation, and price/catalog mismatch must preserve cart/details and expose retry or reconciliation. A lost response can follow a committed write; reconcile that same request rather than claiming no database record exists.

Profile changes must not mutate previous order contact snapshots. Order history must show only the signed-in owner’s orders.

## Migration and analytics limits

Review `qa/account-orders-configuration.md` before enabling a connection.

The original `database-setup.sql`, actual project URL/key, live catalog/schema, and Auth settings were unavailable. The disposable compatibility harness is not the production baseline.

Do not automatically run the original installer, seed/reset an existing database, or apply this migration to live Supabase. Obtain the actual baseline and review prerequisites, function owners/grants, existing policies, all variant keys/prices/availability, shipping, and aggregate contracts first.

The migration intentionally revokes browser execution of the legacy anonymous order RPC for `PUBLIC`, `anon`, and `authenticated`. Guest/mock checkout must call neither order RPC. Do not rerun an installer that restores those grants.

Preserve historical seed/observed records. Do not claim all historical observed records are authenticated.

New saved orders remain observed and appear once in observed/all aggregates. Preserve seed filtering and the live-to-observed alias. Refresh aggregates after confirmed orders and provide a visible refresh control. Render only aggregate counters/totals, never public contact records.

The separately hosted analytics application is unchanged. Do not claim remote dashboard refresh or persistence was verified locally.

Document Auth confirmation policy, Site URL, exact redirect allowlist, password/email settings, and browser-safe configuration separately from SQL. Treat the proposed settings as proposals until checked in the intended project.

## POM, locators, data and suite

Keep interactions and centralized scoped CSS locators in POMs; assertions remain in specifications.

Verified account selectors include:

- `account-mode-guest`, `account-mode-real`
- `real-login-email`, `real-login-password`, `real-login-submit`
- `account-register`, `account-logout`
- `auth-message`, `auth-error`, `account-config-message`
- `profile-form`, `profile-name`, `profile-email`, `profile-phone`
- `profile-shipping-*`, `profile-billing-*`, `profile-same-billing`
- `profile-save`, `profile-status`, `profile-error`, `account-reload`
- `account-orders`, `order-row-*`
- `analytics-source`, `analytics-refresh`, `analytics-output`

Verified checkout additions include `checkout-mode`, `checkout-mode-label`, `customer-phone`, `shipping-*`, and `billing-*`. Retain existing checkout/product/cart selectors. Scope shipping address fields carefully so they are not confused with shipping-method radio inputs.

Preserve:

- 10 desktop cases at 1440×900
- 8 mobile cases at 390×844 with touch/mobile settings
- Mobile exclusion of `*.desktop.spec.js`
- Maximum 18 discovered instances
- RO/EN within existing cases
- No additional cases, language projects, fixed waits, XPath, or regression-hiding skips

Retain existing fixed positive data and ignored overrides through `test-data/shop-data.js`. Keep mock login separate from customer data. New API identities/contact fixtures are fictional and separate from existing positive login/customer fixtures.

Negative cases copy valid data, invalidate one relevant field, and restore valid data without mutating common objects.

Install configuration/API interception before browser navigation, including extra browser contexts. Routine tests must not create live users/orders or contact unexpected account endpoints.

Retain all Studio, catalog/filter, variant/availability, gallery, cart, login/session, guest/authenticated checkout, and bilingual coverage.

Verify EUR with exactly two decimals and independent integer-cent calculations from displayed unit prices and quantities. Preserve the real third-card loop at index 2 and:

`79900 × 2 + 13995 × 3 = 201785 cents`

## Verification and acceptance

1. Check syntax, reviewed diffs, privacy/configuration boundaries, dependency/lockfile consistency, and preservation of protected files.
2. Run SDK unit checks:

   ```bash
   npm run test:account-sdk
   ```

3. Run the disposable database checks:

   ```bash
   npm run test:database
   ```

   Confirm all 27 frontend variant contracts against the synthetic catalog; anonymous/legacy denial; two-owner RLS/history isolation; trusted identity/email/prices; matching retries/conflicts; unavailable/invalid lines; transaction rollback; exact address shape; snapshots; aggregate privacy and seed preservation.

   Do not apply `database/test-baseline.sql` to Supabase.

4. Run the QA helper checks:

   ```bash
   node --test scripts/qa-handoff.test.mjs
   ```

5. Discover existing projects:

   ```bash
   env -u BASE_URL PLAYWRIGHT_HTML_OPEN=never npm test -- --list --reporter=list --project=chromium-desktop --project=chromium-mobile
   ```

6. Run both projects locally:

   ```bash
   env -u BASE_URL PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/account-orders-results.json npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2 --reporter=line,html,json
   ```

7. Within existing cases, verify registration/confirmation, invalid/network login, profile validation/save/prefill, owner isolation, stale-account responses, memory-session expiry, accurate sign-out failure/reset behavior, guest no-writes, terms, account order success, exact retries, duplicate lock, response mismatch, immutable snapshots, and aggregate refresh/privacy.
8. Inspect desktop/mobile/narrow-width browser layouts, scrolling, controls, errors, and keyboard focus. Preserve Studio photo and responsive contracts.
9. Investigate meaningful failures without weakening assertions or hiding regressions.
10. Report actual target, discovered/passed/failed/skipped/flaky/not-run counts, unit/database results separately, changed files, preview/report paths, configuration steps, and unresolved dependencies.
11. Provide the concrete local/private preview for user review. Keep generated artifacts ignored and shared reports free of personal fixtures or credentials.
12. Do not commit, push, merge, deploy, rewrite history, change global Git/SSH settings, dispatch this prompt, make real payments, or claim live Auth/email/analytics/GitHub Actions success.

## Evidence at coordinator review

The coordinator executed read-only source review, syntax checks, discovery, final client/UI syntax checks, and `git diff --check`; these passed.

The coordinator inspected the final `test-results/account-orders-results.json`:

| Project | Discovered | Passed | Failed | Skipped | Not run | Flaky |
|---|---:|---:|---:|---:|---:|---:|
| chromium-desktop | 10 | 10 | 0 | 0 | 0 | 0 |
| chromium-mobile | 8 | 8 | 0 | 0 | 0 | 0 |

Report metadata records `http://127.0.0.1:4173/`, local target, two workers, and no top-level errors.

The main agent separately reported:

- SDK unit checks: 13 passed.
- Disposable database validation: 12 named groups passed, including 27 variant comparisons.
- QA helper checks: 9 passed.
- Focused desktop security regressions: 2 passed.
- Full local E2E: 18 passed in 73.7 seconds.
- Mocked browser checks at 1440, 390, and 320px: contained account panels, no horizontal overflow, visible focus, and no page errors/live API calls.

The final SQL-only exact-address-key hardening was followed by another successful 12-group database run. Website source did not change after the final E2E run.

These results establish local mocked/isolated behavior. They do not establish live schema compatibility, multi-connection PostgreSQL concurrency, actual Auth policy/email delivery, live order persistence, remote dashboard refresh, user final acceptance, or approval/dispatch of this pending prompt.
