# QA-003 r1 — White, electric-blue, and coral theme verification

Status: pending
Language: English
Project: /home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop

## Approval and verified source

This is the follow-up QA handoff for the directly authorized CSS theme refresh. Preparation does not approve or dispatch this prompt.

Before applying this handoff, run `npm run qa:review` and verify explicit approval of QA-003 r1 and matching fingerprints. If source or requirements change, prepare a new revision. Preserve historical approved prompts unchanged.

Reviewed Git HEAD:
e2177b245b3231be585a1b54720d557cdb126375

Reviewed public dist fingerprint:
357fcfe437bb609dd1da6c49b53df39557f3201ab7f425e0a3100e4984a04b6a

Reviewed dist/style.css SHA-256:
ff54351dd7f6c5815eb6873f21c2545e36ca945c7b94929cbf8908c26c674c50

Only dist/style.css differs from this HEAD in the website implementation. HTML, application JavaScript, POMs, fixtures, test data, specifications, and Playwright configuration are unchanged. QA prompt, manifest, and review records document the required handoff.

## Scope and resulting appearance

Verify the refreshed theme:

- White page and dialog surfaces.
- Electric-blue primary actions, active language states, selected gallery borders, and focus accents.
- Pale-blue and pale-coral backgrounds.
- Coral decorative accents, secondary hover states, dismiss/remove/back controls, and readable error text.
- Subtle button/card shadows.

Keep all positions, dimensions, margins, padding, spacing, font families, font sizes, weights, line heights, grids, responsive breakpoints, image geometry, and element order identical.

Preserve DOM structure, IDs, classes, data-testid attributes, text, Romanian/English translations, existing interactions, product swatch meanings, stock behavior, and prices. Add no animations or clickable areas. Preserve the existing toast transition.

If a verified theme defect requires correction, modify only the relevant color, background, border-color, shadow, or focus-paint declaration. Do not compensate by changing layout or behavior.

## POM, locators, data, and suite

No POM, locator, fixture, or specification changes are required.

Retain JavaScript ESM and the current Page Object Model, CSS locator scopes, immutable fixed fixtures, and independent integer-cent expectations. Customer details remain separate from mock login credentials. Keep actual private values out of prompts, documentation, Git, and shared reports.

Verified selectors include:

- Header language controls: data-testid="language-ro" and "language-en".
- Dialog language controls: data-testid="dialog-language-ro" and "dialog-language-en".
- Product dialog: data-testid="product-dialog".
- Product swatches and gallery controls: existing data-testid attributes.
- Cart, checkout, login, and zoom dialogs: existing scoped data-testid selectors.

Preserve exactly 10 chromium-desktop cases at 1440×900 and 8 chromium-mobile cases at 390×844 with isMobile/hasTouch. Mobile continues excluding *.desktop.spec.js. Keep RO/EN inside existing cases.

Do not add cases, rewrite existing tests, change assertions, or update snapshots.

Preserve the public default baseURL and BASE_URL override. Start the local webServer only for localhost or 127.0.0.1. Validate this unpublished theme on the local site.

## Visual and interaction checks

Check normal, hover, keyboard-focus, selected, and disabled states across header controls, primary actions, gallery thumbnails, swatches, close/remove/back buttons, form fields, and language switches.

Guard against generic button:hover overriding:

- White primary-action text and darker-blue primary hover.
- White text on selected blue RO/EN buttons.
- Blue selected-thumbnail borders.

Ensure keyboard focus remains visible without changing element geometry or click targets. Keep semantic red, purple, and black swatch colors unchanged.

Calculated reviewed contrast:

- Primary blue on white: 5.52:1.
- Primary hover blue on white: 7.51:1.
- Deep coral on pale coral: 5.17:1.
- Muted text on black-gallery gray: 4.84:1.
- Control border against white: 3.23:1.

These calculations verify the listed pairs, not a complete accessibility audit. Inspect rendered text and focus indicators on their actual backgrounds.

Preserve existing positive coverage for catalog/filtering, variants/gallery/zoom, cart persistence and mathematics, login/session/logout, checkout, language persistence, and responsive fit.

Preserve existing negative coverage for missing options, unavailable stock, invalid quantities, copied invalid login credentials, invalid checkout fields/card fields, and unchecked terms. Errors must remain readable, rejected actions must preserve cart state, and restored valid data must still succeed.

## Acceptance and reporting

1. Confirm the implementation diff remains confined to CSS appearance; HTML/application/POM/fixture/specification/configuration files remain unchanged.
2. Confirm existing geometry-affecting declarations and all media-query breakpoints match the baseline.
3. Preserve or reproduce the before/after comparison of catalog, product, zoom, cart, address, shipping, review, confirmation, sign-in, and guide states in both languages and both viewports: 40 states with identical DOM and geometry.
4. Inspect hover, selected, disabled, and keyboard-focus states; report any unresolved visual defect.
5. Verify discovery remains 10 desktop plus 8 mobile instances.
6. Run the unchanged projects against the local theme and report the actual URL and passed, failed, skipped, and not-run counts:

   BASE_URL=http://127.0.0.1:4192 QA_USE_LOCAL_TEST_DATA=0 PLAYWRIGHT_HTML_OPEN=never npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2

7. Report browser execution separately from syntax, discovery, contrast calculations, and geometry comparisons. Investigate failures without rewriting tests or accepting new snapshots.
8. Show the changed files and theme diff. Make no claim about the deployed site's appearance or GitHub Actions execution.
9. Do not commit, push, rewrite history, merge, deploy, alter global Git/SSH settings, dispatch this prompt, or perform real payments.
