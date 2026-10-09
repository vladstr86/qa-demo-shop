# QA-004 r1 — Localized analytics navigation link

Status: pending
Language: English
Project: /home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop

## Approval and verified source

This is the follow-up QA handoff for the directly authorized analytics navigation link. Preparation does not approve or dispatch this prompt.

Before applying this handoff, run `npm run qa:review` and confirm explicit approval of QA-004 r1 with matching source/prompt fingerprints. If source or requirements differ, prepare a new revision. Preserve historical approved prompts unchanged.

Reviewed Git HEAD:
e834e15ec1d231c8329cba40bf964746fbbadc2a

Public dist fingerprint:
71dee38ea516e15458e89604cd67f7005e3f53739682ec21f18707e85adf4805

File SHA-256:

- dist/index.html: a45bd0a93d0933c9c5f25c534c1a0cb7712c6c5662e2327ac11a233e0201c366
- dist/app.js: 8e883ab21410fed3e682c7b1d7abf3bc27e2d04042981b0ecc94dccd230f3003
- dist/style.css: 722586fc651f40fd54f86e9bc85c90bac4a7d28f401242ef0feffb182d2c4b44

## Scope

Review and synchronize only the new analytics navigation link in:

- dist/index.html.
- dist/app.js.
- dist/style.css.

Do not add Supabase, analytics data integration, checkout changes, backend requests, tracking, or payment behavior.

Preserve all existing elements, text, translations, interactions, selectors, dimensions, spacing, typography, image geometry, and responsive layout. Preserve the existing theme and semantic product colors.

## Required navigation behavior

Keep exactly one native anchor with:

- data-testid="analytics-link".
- Existing primary and link-button classes.
- Romanian text: `Analiză date`.
- English text: `Data Analytics`.
- Romanian destination: https://vlad-qa-analytics.pages.dev/?lang=ro.
- English destination: https://vlad-qa-analytics.pages.dev/?lang=en.

Use ordinary same-tab navigation. Do not add target="_blank", download, custom click interception, or window-opening behavior.

Only the language parameter belongs in the destination. Do not append customer, account, cart, order, or payment values.

renderAnalyticsLink() is called from existing renderShell(), so the label and destination follow the selected language on initialization, header/dialog language changes, and reload.

Keep the anchor after .hero-art in DOM order. The existing first-match `.hero .link-button` selector must continue updating the original catalog link.

## Placement and styling

The new anchor occupies unused bottom padding of the existing hero:

- .hero gains position:relative.
- The analytics link is positioned absolutely without entering the grid flow.
- Existing hero/art/notice bounds remain unchanged.
- Mobile sizing and focus adjustments remain scoped to the new data-testid selector.

Preserve readable blue/white normal and hover states and visible keyboard focus. The new link must fit within the existing gap without covering other controls, clipping its focus ring, or creating horizontal overflow.

Preserve all pre-existing layout rules and breakpoint behavior.

## POM, data, and test contract

No existing POM, fixture, data, configuration, or specification changes are required or authorized by this handoff. Do not rewrite tests or snapshots.

Use the verified CSS locator `[data-testid="analytics-link"]` for temporary browser verification. Keep any temporary checks outside permanent Playwright discovery.

Preserve JavaScript ESM, Page Object Model, CSS locators, immutable fixed fictional fixtures, and existing private-data rules. Keep personal values and credentials out of tracked files and reports.

Preserve EUR with exactly two decimal places and integer-cent calculations. Existing tests continue independently recalculating subtotal from displayed unit prices and quantities.

Maintain:

- chromium-desktop: 10 cases, 1440×900.
- chromium-mobile: 8 cases, 390×844, isMobile/hasTouch.
- Mobile exclusion of *.desktop.spec.js.
- RO/EN inside existing cases.
- Maximum 18 discovered instances.

Preserve the deployed default baseURL, BASE_URL override, and localhost/127.0.0.1-only local webServer condition. Verify this unpublished change against localhost.

## Acceptance and verification

1. Confirm the source diff contains only one anchor, the localized rendering helper/call, and scoped positioning styles.
2. Confirm all existing POMs, tests, fixtures, data, configuration, and workflow remain unchanged.
3. Check one visible analytics link has the exact RO/EN text and destination.
4. Switch language through header and dialog controls; verify both label and href update. Reload and verify the persisted language.
5. Activate the link by mouse and keyboard in temporary browser checks. Verify the same page navigates to the exact selected-language URL without opening another page. If a controlled destination response is used, report that limitation; do not claim the remote analytics application was tested.
6. Verify no stale locale, unintended query values, intercepted navigation, or collision with the existing catalog link.
7. Preserve the reported before/after comparison at widths 320, 360, 375, 390, 430, 700, 701, 900, 1200, and 1440 in both languages: existing DOM and element bounds remain identical when excluding the new anchor; page width is unchanged.
8. Check syntax and discover exactly 10 desktop and 8 mobile instances.
9. Run the unchanged suite locally:

   BASE_URL=http://127.0.0.1:4194 QA_USE_LOCAL_TEST_DATA=0 PLAYWRIGHT_HTML_OPEN=never npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2

10. Report the actual target URL and passed, failed, skipped, and not-run counts. Preserve existing positive and negative shop coverage, including variants/gallery, quantities/stock, login, checkout validation, language persistence, and independent totals.
11. Show the changed files and diff. Separate static/discovery checks, layout comparisons, temporary navigation checks, and actual E2E results.
12. Do not commit, push, rewrite history, merge, deploy, change global Git/SSH settings, dispatch this prompt, or perform real payments.
