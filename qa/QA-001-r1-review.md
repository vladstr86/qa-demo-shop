# QA-001 r1 implementation and test review

Date: 2026-10-09 (Europe/Bucharest).

QA-001 r1 was approved for manual application in this conversation. Before editing, the agent confirmed the project directory `/home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop`, located `qa/prompts/QA-001-EUR.md`, and ran `npm run qa:review` successfully. The approved prompt remains unchanged. No prompt was dispatched to another Codex process or to VS Code.

The reviewed fingerprints are:

- Prompt SHA-256: `f3b294b17825c6b8e01aa78fc8defb86c9cab3c2df2deb512f331d3b0d4c0bab`.
- Website SHA-256: `9ecd935b61eecc5f28543c2bc4a2bb6f28536dfcb825338b28bf0c3ae8f50daf`.
- Reference source SHA recorded in the manifest: `967675b1e203d6920d925610364b7300587c4dad`.

The manifest's initial `pending` value describes the prepared CLI handoff; manual conversation approval and implementation are recorded here. This directory has no Git repository metadata, so the reference commit is a manifest label rather than a locally checked-out commit. No commit, push, merge, deploy, global Git/SSH change, or real payment operation was performed.

## Website assessment

Read-only inspection confirmed `dist/app.js` already implements approved EUR base/variant prices, Pulse's lower catalog starting price, integer-cent subtotal/shipping/total calculations, and a saved confirmation amount before clearing the cart. Language changes preserve variants, quantity, checkout values, and the completed order amount. No website behavior, UI, or assets needed modification, and no new website handoff prompt was triggered.

English is now the permanent language in `AGENTS.md`, the coordinator configuration, documentation, test names, and new project work. Website translations and localized expected strings remain Romanian/English. The original Romanian QA-001 prompt is retained as an immutable approval record.

## Thorough test review and consolidation

Initial discovery found **78 instances: 39 desktop + 39 mobile**, rather than the reference archive's 62. The feature-based suite contained 31 scenarios; `tests/shop.spec.js` added eight obsolete duplicates using RON, old nonvariant cart selectors, one-step checkout, and direct DOM operations. Useful coverage was integrated before removing obsolete cases. The six per-product image tests and separate image-tile test were merged into catalog/product cases with loops and steps.

Final discovery is **18 instances: 10 desktop + 8 mobile**, with no skipped cases and no extra language projects. Mobile discovery excludes `*.desktop.spec.js`. Viewports remain 1440×900 and 390×844, with `isMobile` and `hasTouch` enabled for mobile.

| Case | Projects | Preserved and strengthened coverage |
| --- | --- | --- |
| Catalog | Both | Six cards, RO/EN fixed starting prices, case-insensitive search, category/search empty state, multi-brand OR/category AND, stock/reset, all 45 PNG responses/signatures, decoded tiles and cover bounds. |
| Product/variants/gallery | Both | All base and upgraded fixed prices in RO/EN, variant preservation, all six products and configurable colors, decoded main/thumbnail/zoom images, next/previous wrapping, exclusive radio colors. |
| Cart | Both | Required index-2 POM `for`/`break` with identity assertion before opening Pulse; exact two-line fixtures; displayed unit-price × quantity calculation at 201785, 121885 and 79900 cents; RO/EN, shipping prices, rejected 0/11, refresh, distinct variants, identical-variant merge, reset and empty checkout. |
| Mock login | Both | Copied invalid credentials, exact RO/EN errors, valid tab-session login, reload and logout. |
| Guest checkout | Both | Independent two-product subtotal, Standard → Express → Standard in RO/EN at 202085/202435/202085 cents; fixed contact, shipping/billing and dummy card; newsletter, Back, terms, translated review/confirmation, empty cart and retained order amount. |
| Negative products | Both | Missing options/focus, all unavailable configurable combinations, unavailable simple product, 0/11 with positive restoration, accepted 10 and cumulative 11 rejection; unchanged seeded cart and subtotal. |
| Negative checkout | Both | Single-field copies of fixed customer/card data, restoration, missing name/address/billing, invalid email/card/expiry/CVV, required terms; exact RO/EN reasons, unchanged displayed and stored cart, 4299/4649 mouse shipping totals, valid completion. |
| Bilingual/responsive | Both | Persisted language and cart after refresh; product variants/quantity, all contact/billing/newsletter/card/expiry/CVV/shipping/terms values across language changes and Back; retained confirmation cents; viewport fit for catalog and every dialog. |
| Authenticated checkout | Desktop | Mock-account email prefill checked before fixed positive customer replaces it; default same-billing, Back, optional newsletter unchecked, Standard/cash, review and retained confirmation after clearing cart. |
| Session/remember me | Desktop | Both storage lifetimes, reload, a new context with copied persistent storage but no sessionStorage, logout and logged-out reload. |

POMs now centralize scoped CSS locators and DOM interactions. Assertions remain in tests. Cart expectations independently read unit prices and quantities from DOM, check fixture cents, and multiply integer values with failure diagnostics. They do not import the application's arithmetic or formatter. The independent parser validates EUR symbol placement, locale separators, grouping, and exactly two decimals, including Unicode spaces. Fixture formatting uses integer cents and literal formatting rather than the application's `Intl` formatter.

The positive customer, card, account, prices, and nested variant data are frozen. Negative inputs use copies and restore valid fields. `CheckoutPage.card()` defaults now use the fixed dummy card. A stored-cart baseline supplements negative-checkout DOM checks because the closed cart's markup remains stale until reopened.

A read-only `qa_coordinator` review checked the consolidated coverage against QA-001 r1 and the initial scenario inventory. Its findings led to exact localized negative-checkout messages, explicit default same-billing coverage, and stored-cart invariance checks without adding instances.

## Changed files

- POM/data: `pages/ShopPage.js`, `ProductPage.js`, `AccountPage.js`, `CheckoutPage.js`, new `pages/image.js`; `components/Cart.js`; `fixtures/shop.js`; `test-data/shop.js` and new `test-data/shop.test.mjs`.
- Tests: catalog/product/cart/auth/checkout/i18n feature specs; new `tests/auth/session.desktop.spec.js` and `tests/checkout/authenticated.desktop.spec.js`; removed obsolete `tests/shop.spec.js` and merged `tests/product/images.spec.js`.
- Configuration/documentation: `playwright.config.js`, `AGENTS.md`, `.codex/agents/qa_coordinator.toml`, `README.md`, `PROJECT.md`, `qa/WORKFLOW.md`, and this report.
- Browser artifacts: `playwright-report/` and `test-results/` are generated by Playwright.

`dist/`, the reviewed prompt, manifest fingerprints, dependencies, and npm commands remain unchanged.

## Verification

- **Passed:** pre-edit `npm run qa:review`; valid exact QA-001 r1 prompt/site fingerprints.
- **Passed:** `node --check` for all 22 JavaScript files in configuration, POM, fixtures/data, tests, scripts, and the application; coordinator TOML parsed successfully.
- **Passed:** `node --test --test-isolation=none scripts/qa-handoff.test.mjs test-data/shop.test.mjs` on Node 24.7.0: 12 passed, 0 failed. These are Node checks, not E2E.
- **Passed:** `npx playwright test --list`: 18 instances in eight files, exactly 10 desktop and 8 mobile.
- **Passed:** `npm test -- --workers=2`: 18 browser E2E instances passed, 0 failed, 0 skipped, in 49.4 seconds. The initial sandbox attempt could not bind localhost (`listen EPERM`); an approved sandbox escalation allowed the temporary local server and Chromium to run.
- **Passed:** `npm test -- tests/checkout --workers=2` after the independent review refinements: all five affected browser E2E instances passed, 0 failed, 0 skipped, in 13.7 seconds. The latest generated HTML report contains this targeted run; the preceding complete run passed all 18 instances.
- **Passed:** final `npm run qa:review`: the original QA-001 r1 prompt and website fingerprints still match. Final JavaScript/TOML checks also passed; a source scan found no direct DOM interactions/locators in tests or fixtures, fixed waits, XPath, `parseFloat`, or skipped/focused cases.
- **Passed:** final independent coordinator review found no remaining substantive defects in the implementation or consolidated coverage. It did not claim to run browser E2E; the browser results above were executed by the main agent.

There are no claims of deployment or user manual acceptance. Additional browser engines and external/private environments are outside this approved run.
