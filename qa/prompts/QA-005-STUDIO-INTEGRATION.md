# QA-005 r1 — Approved Studio integration and regression verification

Status: pending  
Language: English  
Project: `/home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop`

## Approval and source contract

This is the follow-up QA handoff for the directly authorized Studio integration. The Studio design approval authorized the current local integration and test adaptation. It does not constitute approval or dispatch of this separately prepared QA-005 r1 prompt.

Before applying this handoff, run `npm run qa:review`, confirm explicit user approval of **QA-005 r1**, and verify matching source/prompt fingerprints. If source, requirements, or prompt text differ, stop application and prepare a new revision. Preserve all historical approval records unchanged.

Review and retain the existing integrated implementation. Synchronize or correct it only where the acceptance checks below identify a concrete defect. Do not replace the project or blindly overwrite application files.

Reviewed Git HEAD:

`e834e15ec1d231c8329cba40bf964746fbbadc2a`

Reviewed branch:

`feat/store-theme-and-analytics-link`

Public `dist/` fingerprint:

`1783ca1de39e8e943dfb20ecd2c55b88a71fa3ae4c178d110a1a1c51ede00aa7`

Reviewed file SHA-256:

- `dist/index.html`: `774d2c71cfc5d59ee7130457a74191d6665c3e35b3677f7366d2b99278505c9a`
- `dist/app.js`: `27b5faa42dbe071b69bbc270b93a38dfb2a6b15d57650a13d45449bf233f077c`
- `dist/style.css`: `71cf252824cb4d0093f8e314e77624b9d2232238f91632b7c14411d03e80b51d`
- `dist/design.css`: `83f3ce4b4c05d0ef1254c6b94add8a5f2fff3645b9643b16f3893b6c3aca7539`
- `dist/photo-credits.html`: `7ba297aeaf0b15f5bbdacc1de8e9d746e295341b63ebffb7b369aac997eb4628`

The pre-integration backup at `/tmp/qa-studio-before-mo88qgzr` preserves the previous frontend and staged patch. The main agent reported that the existing QA-004 r1 source gate passed before editing, all 28 reference manifest entries matched, and the three frontend files matched `LIVE-BASELINE.json`.

Preparation must calculate the actual current fingerprints. Do not copy historical fingerprints merely to make a stale gate pass.

## Scope and preservation

Use `/home/vlad/ProjectDemo/studio-reference/CODEX-STUDIO-INTEGRATION.md` and its verified reference package as the approved design source.

Retain the approved white, graphite, and sage Studio presentation in:

- `dist/index.html`
- `dist/app.js`
- `dist/style.css`
- `dist/design.css`
- `dist/photo-credits.html`
- `dist/assets/products/{productId}-{view}.jpg`, for product IDs 1–6 and views 1–3
- `PHOTO-CREDITS.md`
- `photo-sources.json`

Retain JPEG MIME support in `scripts/serve.mjs`.

Keep English documentation accurate in `README.md`, `PROJECT.md`, and the separate implementation review report.

Preserve existing staged and unstaged changes, ignored personal fixtures, current account loading, fixed catalog data, stock rules, cart, login, checkout, selectors, and analytics integration. The Studio design supersedes the earlier visual presentation and analytics placement, while preserving the analytics link’s functional contract. Do not reapply obsolete layout instructions from historical QA prompts.

Do not overwrite `package.json`, `package-lock.json`, Playwright configuration, GitHub Actions, `.gitignore`, fixture loaders, fictional defaults, ignored local data, or historical prompts. Do not import the reference preview account loader or replace the current account mechanism.

Preserve JavaScript ESM and the existing npm scripts. Keep technical communication, documentation, identifiers, comments, and test names in English. Preserve Romanian/English UI translations and localized assertions.

## Website behavior

Retain the Atlas hero using these verified selectors:

- `[data-testid="hero-product-open"]`
- `[data-testid="hero-photo"]`
- `[data-testid="hero-image-fallback"]`
- `[data-testid="hero-price"]`

The hero must open Laptop Atlas 14 by mouse or keyboard. Its base price is 79900 cents, formatted as EUR with exactly two decimal places. The photograph is `assets/products/1-1.jpg`. Translate its alternative text and useful failure fallback. An image failure must preserve the Atlas action.

Use all 18 supplied real photographs without changing their bytes, generating replacements, recoloring them, or substituting AI images. Preserve credits, source links, photographers, and licenses.

Every product has three distinct photographs at:

`assets/products/{productId}-{view}.jpg`

Color selection must preserve the current photograph and thumbnail sources. Variant prices, completeness, stock status, radio exclusivity, and add-to-cart availability must still update. Preserve unavailable combinations and unavailable product behavior.

Retain gallery selectors:

- `[data-testid="gallery-image"]`
- `[data-testid="gallery-zoom"]`
- `[data-testid="gallery-prev"]`
- `[data-testid="gallery-next"]`
- `[data-testid="gallery-thumb-1"]`
- `[data-testid="gallery-thumb-2"]`
- `[data-testid="gallery-thumb-3"]`
- `[data-testid="zoom-dialog"]`

Retain translated gallery accessible names, illustrative-photo descriptions, selected thumbnail state, previous/next wrapping, and zoom.

Keep one native same-tab analytics anchor at `[data-testid="analytics-link"]`:

- Romanian label: `Analiză date`
- Romanian destination: `https://vlad-qa-analytics.pages.dev/?lang=ro`
- English label: `Data Analytics`
- English destination: `https://vlad-qa-analytics.pages.dev/?lang=en`

Its label and destination follow initialization, header/dialog language changes, and reload. Do not append customer, authentication, cart, order, or payment data. Do not add backend integration or Supabase writes.

Manual language selection must update both the `lang` URL parameter and `atelier-tech-language` localStorage value. Preserve other query parameters and the hash. A valid initial query language takes precedence; subsequent manual selection must survive reload without restoring the stale query language.

Retain bilingual photo-credit navigation and table headers using:

- `[data-testid="photo-credits-link"]`
- `[data-testid="photo-credits-title"]`
- `[data-testid="photo-credits-table"]`
- `[data-testid="photo-credits-language"]`
- `[data-testid="photo-credits-back"]`

The credits page must list 18 distinct source records, retain attribution/license links, translate accessible navigation names and column headers, persist language, and return to the store with the selected language. Remove public preview-only wording while preserving source titles and photographer attribution.

## Existing suite, POMs, and data

Adapt the existing suite; do not create a parallel suite or add cases.

Reviewed adaptation files:

- `pages/ShopPage.js`
- `pages/ProductPage.js`
- `tests/catalog/catalog.spec.js`
- `tests/product/product.spec.js`
- `tests/i18n/i18n.spec.js`

Keep DOM interactions and centralized CSS locators in POMs; keep assertions in specifications. Reuse the existing image decoding/frame helpers in `pages/image.js`. Scope locators to their catalog, dialog, table, or cart row. Do not use XPath, fixed waits, or new language projects.

Preserve:

- `chromium-desktop`: 10 cases at 1440×900.
- `chromium-mobile`: 8 cases at 390×844 with mobile/touch settings.
- Mobile exclusion of `*.desktop.spec.js`.
- Maximum 18 discovered instances.
- RO/EN checks grouped inside existing cases.
- No additional skipped mobile scenarios.

Retain existing catalog/filter, product, cart, authentication, checkout, session, and bilingual coverage. Replace obsolete PNG/color-specific image expectations with the approved JPEG contract; do not weaken functional assertions or update snapshots to conceal regressions.

Positive data remains immutable and loaded through `test-data/shop-data.js` from fictional tracked defaults, optional ignored local fixtures, or explicit `QA_*` environment overrides. CI must remain runnable without ignored files. Resolve login separately from customer details through explicit overrides or the selected website’s advertised mock account.

Negative flows copy common valid data, invalidate one relevant field, and restore valid data. Preserve missing-option, unavailable-stock, quantity-limit, invalid-login, address, billing, payment, and terms checks.

Never write personal values or actual local credentials into source, prompts, README, diagnostics, screenshots intended for sharing, or uploaded reports. Do not read or replace ignored personal fixtures to implement this handoff.

## Independent EUR verification

Application amounts and expected calculations use integer cents. Verify exactly two decimal places in both locales with the existing independent currency parser.

Recalculate subtotal from displayed cart unit prices and quantities. Compare that independent result with fixed expected amounts and the displayed subtotal; do not import application calculations or derive the expected result from the displayed grand total.

Preserve this controlled cart:

`79900 × 2 + 13995 × 3 = 201785 cents`

Add Atlas base quantity 2 and Pulse wireless quantity 3.

Keep `ShopPage.openProductAtIndex(2, ...)` using its real `for` loop over catalog cards. Assert `{ index: 2, name: 'Căști Pulse Pro', id: 3 }` before opening the third catalog product. Do not substitute index 3 or bypass the loop with direct product navigation.

Preserve independent checks for quantity changes, invalid quantities, removal, merging distinct variants, persistence, shipping changes without accumulation, checkout totals, and reset.

## Acceptance and verification

1. Compare the selective integration with the approved package and pre-integration backup. Preserve unrelated changes and the original staged patch.
2. Verify all 18 installed JPEGs match the supplied photograph hashes, are distinct, return JPEG content types/signatures, and decode in Chromium with positive natural dimensions.
3. Verify hero price, bilingual alternative text, keyboard activation, and the controlled image-failure fallback.
4. Verify combined search/category/brand/stock filters and useful empty results.
5. Verify each product’s three gallery views, thumbnails, selected state, previous/next wrapping, zoom, and contained image bounds.
6. Verify swatches remain mutually exclusive and do not change photograph sources. Verify actual variant prices and unavailable states.
7. Verify exact bilingual analytics destinations and native same-tab anchor behavior. Report controlled-navigation limitations separately from testing the remote analytics application.
8. Verify language through header and dialog controls, URL/storage persistence, stale-query reload, retained query/hash, and preserved variant/cart/checkout data.
9. Verify the credits page’s 18 source rows, attribution/license links, localized headers with `scope="col"`, accessible navigation, language switch, and return link.
10. Check the real browser at desktop/mobile widths and a narrow 320px viewport for horizontal overflow, usable controls/dialogs, gallery frames, and visible keyboard focus. User visual review remains required.
11. Check syntax, then discover both projects:

    ```bash
    BASE_URL=http://127.0.0.1:4173 PLAYWRIGHT_HTML_OPEN=never npm test -- --list --reporter=list --project=chromium-desktop --project=chromium-mobile
    ```

12. Run both existing projects against the integrated local site:

    ```bash
    BASE_URL=http://127.0.0.1:4173 PLAYWRIGHT_HTML_OPEN=never PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/studio-results.json npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2 --reporter=line,html,json
    ```

13. Preserve the deployed default `https://vlad-qa-demo-shop.pages.dev/`, `BASE_URL` override, and localhost/127.0.0.1-only webServer condition. Do not validate unpublished Studio changes against the deployed website.
14. Investigate meaningful failures and fix the cause while preserving intended functionality. Do not weaken assertions, rewrite the suite, add skips, or conceal failures.
15. Report discovered, passed, failed, skipped, flaky, and not-run counts per project, the actual target URL, commands, limitations, changed files, and report paths. Syntax/discovery outcomes are separate from E2E results.
16. Provide the actual local preview and HTML report for user review. Generated artifacts remain ignored; check shared reports for sensitive values.
17. Do not commit, push, merge, deploy, rewrite history, change global Git/SSH settings, dispatch this prompt, perform real payments, or claim a GitHub Actions pass without an actual workflow run.

## Evidence at coordinator review

The coordinator executed read-only syntax checks for the application, two adapted POMs, three adapted specifications, and local server; all exited successfully.

The coordinator executed discovery: **10 desktop and 8 mobile instances, 18 total across 8 files**.

The coordinator independently verified **18 distinct installed JPEG hashes** and exact equality of both licensing documents with `studio-photos`.

The coordinator inspected `test-results/studio-results.json` from the main agent’s actual local run:

| Project | Discovered | Passed | Failed | Skipped | Not run |
|---|---:|---:|---:|---:|---:|
| chromium-desktop | 10 | 10 | 0 | 0 | 0 |
| chromium-mobile | 8 | 8 | 0 | 0 | 0 |

The report contained no top-level errors. The main agent reported no flaky results and successful additional browser checks at widths 1440, 390, and 320.

Main-agent-provided review endpoints:

- Store: `http://127.0.0.1:4173/`
- Playwright report: `http://127.0.0.1:9323/`
- HTML artifact: `playwright-report/index.html`
- JSON evidence: `test-results/studio-results.json`

These checks establish the reported local behavior. They do not record user visual acceptance, approve this pending prompt, dispatch it, or establish a deployed/GitHub Actions result.
