# QA-002 r1 — Private fixture separation and demo-account synchronization

Status: pending
Language: English
Project: /home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop

## Approval and scope

This is a follow-up QA handoff for the directly user-authorized separation of private test data and demo credentials. Preparing this prompt does not dispatch it or approve its application.

Before applying this handoff, run `npm run qa:review` and confirm explicit approval of QA-002 r1, matching prompt/source fingerprints. If source or requirements differ, stop and prepare a new revision. Preserve the original QA-001 approval record unchanged locally.

Do not commit, push, rewrite Git history, merge, deploy, change global Git/SSH settings, or perform real payments.

## Verified source

Reviewed working tree based on Git HEAD:
5b3991c258ab1ad23ea53a24fa9c26cfec1228b2

Public dist fingerprint:
031105b13987a8314eb2751ad52779e61dc3e3583bf994ab0dc1d70ae5dda0d0

dist/app.js SHA-256:
578b2a34385706560d51b9eece5c73a0ea13f9bceca838f922d31037fced97eb

The fingerprint excludes ZIP archives and the ignored demo.local.json override. The tracked fictional example remains fingerprinted. No ZIP archive was present during review.

## Concrete change

dist/app.js loads the mock account before initializing the shop. An optional ignored dist/demo.local.json preserves private local behavior; dist/demo.example.json provides fictional fresh-checkout defaults.

Missing optional configuration may return HTTP 404/410 or an HTML fallback from a static host. These permit the fictional fallback. Invalid supplied JSON, unexpected fields, invalid account structure, and other loading failures must remain visible failures rather than silently selecting different credentials.

The same selected account drives the login dialog, bilingual QA guide, login validation, stored authentication, restoration after reload, and authenticated checkout email prefill. Preserve all other shop behavior and Romanian/English strings.

## Affected implementation and test structure

Review and synchronize only the necessary existing files:

- dist/app.js and dist/demo.example.json.
- test-data/fixture-loader.js, shop-data.js, shop.example.json, and shop.test.mjs.
- fixtures/shop.js.
- pages/AccountPage.js, ShopPage.js, and CheckoutPage.js.
- components/Cart.js and existing feature specifications.
- .gitignore, README.md, PROJECT.md, AGENTS.md, qa/WORKFLOW.md.
- scripts/qa-handoff.mjs and its existing Node checks where fingerprint exclusions require verification.

Keep ignored private files local and intact. They must not be required by a fresh checkout or GitHub Actions. Previously tracked private fixtures and the historical prompt must remain removed from Git tracking without deleting their local copies.

All test and POM consumers must import public test-data/shop-data.js rather than directly importing the private legacy fixture.

## Data and Page Object requirements

Preserve JavaScript ESM, Page Object Model, centralized CSS locators, immutable fixed positive data, and assertions in specifications.

Fixture precedence is explicit QA_* environment fields, then optional local JSON or legacy ESM fixture groups, then tracked fictional defaults. Local JSON takes precedence over legacy ESM. CI and QA_USE_LOCAL_TEST_DATA=0 skip both private sources.

Support customer, card, and separate account groups. Require a complete login pair or an empty pair. Empty login placeholders resolve the selected website's advertised account through AccountPage.demoAccount(); never derive login credentials from customer data.

Preserve the verified CSS scope:

- Login dialog: [data-testid="login-dialog"].
- Advertised account values: dialog-scoped p b.
- Existing login fields and buttons: dialog-scoped data-testid selectors.
- Shop initialization readiness: visible [data-testid="product-card-1"].

Reading advertised credentials must preserve whether the login dialog was already open. Navigation and reload must await actual shop readiness without fixed delays.

Validation messages must identify invalid structure without revealing supplied private values.

## Existing positive and negative coverage

Retain and, only if necessary, adjust assertions within existing cases:

- Invalid copied login password produces the correct RO/EN error and no authentication state; restored valid credentials support login and logout.
- Tab-session and remember-me authentication survive reload with their existing storage lifetimes; a separate browser context preserves only the expected remembered state.
- Authenticated checkout first displays the account email, then accepts the separate fixed customer fixture.
- Customer, shipping, billing, newsletter, card, terms, and review values survive existing language changes and Back navigation.
- Negative checkout copies the positive fixture, invalidates one relevant field, verifies rejection, and restores valid data without mutating shared objects.
- Existing cart and checkout expectations independently recompute subtotal from displayed unit prices and quantities using integer cents. EUR retains exactly two decimal places.

Use the existing Node checks for missing private files, CI/public mode, precedence, environment overrides, incomplete login pairs, malformed files/imports, unknown fields, immutability, and privacy-safe errors. Do not add Playwright cases.

## Configuration constraints

Preserve:

- Default baseURL https://vlad-qa-demo-shop.pages.dev/.
- BASE_URL environment override, including fallback when the optional GitHub repository variable is empty.
- Local webServer only for parsed hostname localhost or 127.0.0.1.
- chromium-desktop at 1440×900: maximum 10 cases.
- chromium-mobile at 390×844 with isMobile/hasTouch: maximum 8 cases.
- Mobile exclusion of *.desktop.spec.js.
- RO/EN coverage within the same cases, with maximum 18 discovered instances.

## Acceptance and verification

1. Inspect imports and Git-eligible files; no original private values or ignored configuration are included. Examples contain only fictional values or empty placeholders, and README contains no personal values or literal credentials.
2. Verify syntax and execute the relevant existing Node checks. Report them separately from E2E.
3. Discover exactly 10 desktop and 8 mobile instances.
4. Run both existing projects against the public default using fictional customer/payment defaults. Verify preserved private fixtures only against localhost; do not bypass an approval-review rejection of sensitive external test payloads.
5. Run both projects from a public-source checkout without ignored files. Verify fictional customer/card defaults and advertised-account login work against the deployed site.
6. Verify the local site without private configuration initializes from its fictional example and retains login, reload, logout, authenticated checkout, and bilingual behavior. Reuse existing cases.
7. Report actual target URLs and passed, failed, skipped, and not-run counts for each execution. Investigate failures and state unresolved causes.
8. Show changed files, privacy-safe review evidence, and files removed from tracking.
9. Do not claim GitHub Actions passed until an actual GitHub workflow has run.
