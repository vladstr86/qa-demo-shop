# QA-005 r2 — Studio verification with local development default

Status: pending  
Language: English  
Project: `/home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop`

## Revision and authorization

The user explicitly selected: **“Local Studio by default (change the earlier default requirement).”**

This revision supersedes QA-005 r1’s deployed-default requirement. It retains every Studio behavior, asset, data, locator, suite, and verification acceptance criterion from the immutable [QA-005 r1 prompt](QA-005-STUDIO-INTEGRATION.md).

The directly authorized configuration fix does not alter website source or require another website-design approval. This prepared r2 handoff remains pending; preparation does not approve or dispatch it. Before future application or dispatch, obtain explicit approval of **QA-005 r2**, run `npm run qa:review`, and confirm matching fingerprints. Preserve historical prompts unchanged.

If requirements or analyzed source differ, prepare an updated revision rather than bypassing the review gate.

## Verified source and scope

Public `dist/` fingerprint remains:

`1783ca1de39e8e943dfb20ecd2c55b88a71fa3ae4c178d110a1a1c51ede00aa7`

Reviewed configuration SHA-256:

- `playwright.config.js`: `f14e9966500d2446da53600084026887890966b96b7edc27c34ea7c8274455b9`
- `.github/workflows/playwright.yml`: `e51fee966c7f0877ee0f7e7cd4ebc5934c64a897b03aededfcd8772b603a36c1`

The QA manifest fingerprints public website content. Additionally inspect the configuration/workflow hashes and concrete diff because those files are outside that website fingerprint.

This revision permits only the reviewed target changes in:

- `playwright.config.js`
- `.github/workflows/playwright.yml`
- `README.md`

This narrowly supersedes r1’s instruction to preserve those files unchanged. Preserve the website, POMs, test specifications, fixtures, personal ignored files, package/lockfile, existing scripts, staged changes, and all other configuration.

Keep technical content in English and preserve the Romanian/English website.

## Local target contract

Set the default Playwright `baseURL` to:

`http://127.0.0.1:4173/`

Preserve the `BASE_URL` environment override.

Both an unset and an empty `BASE_URL` must use the local default. Plain `npm test`, headed/UI commands, direct Playwright commands, and VS Code’s Playwright Testing panel must use the same configuration default when their environment supplies no override. Do not introduce separate project configurations.

Start the existing local `webServer` only when the selected hostname is `localhost` or `127.0.0.1`. Preserve selected-port handling and existing server reuse behavior.

An explicit override such as:

`BASE_URL=https://vlad-qa-demo-shop.pages.dev/`

must select that deployed website without starting the local server.

Preserve report metadata:

- `targetURL`: selected origin and pathname.
- `targetType`: `local` or `deployed`.

Do not include URL credentials, query parameters, fragments, personal fixture values, or authentication data in target metadata.

Retain the existing optional `test:local` helper. Ordinary test commands must also select local Studio by default; correctness must not depend on using that helper.

## GitHub Actions contract

Preserve the workflow’s public target behavior explicitly:

```yaml
BASE_URL: ${{ vars.BASE_URL || 'https://vlad-qa-demo-shop.pages.dev/' }}
```

An empty or absent GitHub repository variable must therefore use the public website, even though development’s configuration default is now local.

Preserve workflow triggers, read-only permissions, Node version, dependency/browser installation, actual desktop/mobile project names, timeout, failure status, and report/result uploads with 14-day retention.

Do not deploy Studio, change repository variables, or claim a GitHub Actions pass. The public website must contain Studio before its existing Studio assertions can pass there.

## Preserved Studio and test acceptance

Every r1 acceptance criterion remains required, including:

- Approved white/graphite/sage presentation; Atlas hero with fixed EUR price, keyboard activation, translated alternative text, and useful failure fallback.
- All 18 original attributed photographs, three distinct views per product, unchanged bytes, JPEG responses and successful browser decoding.
- Unchanged photograph sources across color selection, while variant prices, radio exclusivity, completeness, stock, and add-to-cart availability update.
- Search/category/brand/stock combinations, empty results, gallery thumbnails, previous/next wrapping, zoom, and contained frames.
- Native same-tab analytics link with exact Romanian/English labels and `?lang=ro` or `?lang=en`.
- Language changes through header/dialog controls, URL and localStorage persistence, stale-query reload, preserved other query/hash values, and retained variant/cart/checkout state.
- Bilingual credit navigation and accessible column headers; 18 original sources, photographers, and license records.
- Existing login/session, cart, guest/authenticated checkout, and useful negative flows.
- JavaScript ESM, Page Object Model, centralized scoped CSS locators, assertions in specifications, and no XPath or fixed waits.
- Maximum 10 desktop cases at 1440×900 and 8 mobile cases at 390×844; mobile excludes `*.desktop.spec.js`; RO/EN remains inside existing cases without added cases or skips.
- Immutable fixed positive data through the existing fictional/default/private override mechanism; CI runnable without ignored files; login resolved separately from customer data.
- Negative cases copy valid data, invalidate one relevant field, and restore valid data.
- EUR with exactly two decimal places and independent integer-cent calculations from displayed unit prices and quantities.
- Atlas base quantity 2 plus Pulse wireless quantity 3 totals `79900 × 2 + 13995 × 3 = 201785` cents before delivery.
- The real `openProductAtIndex(2, ...)` loop and third-card identity assertion.
- Actual desktop/mobile/narrow-width browser checks, visible keyboard focus, privacy-safe reports, and user final visual review.

Use the verified selectors and affected POM/specification files documented in r1. Do not invent selectors, rewrite the suite, weaken assertions, or update snapshots to hide regressions.

## Documentation and verification

Explain the local default for all standard entry points and the explicit public override. Explain that an inherited deployed `BASE_URL` still takes precedence; unset it or supply the local URL, then reload VS Code’s Playwright tests after configuration changes.

Retain installation, live website URL, GitHub Actions, fictional-data, and report instructions. Keep personal values out of documentation and reports.

Check configuration syntax and discover both projects without a target override:

```bash
env -u BASE_URL PLAYWRIGHT_HTML_OPEN=never npm test -- --list --reporter=list --project=chromium-desktop --project=chromium-mobile
```

Run both projects against the new default without `BASE_URL`:

```bash
env -u BASE_URL PLAYWRIGHT_HTML_OPEN=never npm test -- --project=chromium-desktop --project=chromium-mobile --workers=4
```

Confirm the actual report target is `http://127.0.0.1:4173/`. Report actual discovered, passed, failed, skipped, flaky, and not-run counts per project.

Verify configuration selection separately for unset/empty values, `localhost`, `127.0.0.1`, and an explicit public URL. Static configuration checks do not constitute public-site E2E passes.

Investigate failures using their actual target and source version. The user’s earlier failed report was reported by the main agent as targeting the older public website: 10 passed and 8 failed. Preserve that evidence rather than presenting it as a local Studio regression or concealing it.

Provide the current local preview, actual HTML report, changed files, and execution command. Do not commit, push, merge, deploy, rewrite history, change global Git/SSH settings, perform real payments, or dispatch this prompt.

## Coordinator evidence

Read-only checks executed for this revision:

- Configuration syntax passed.
- Unset and empty `BASE_URL` selected local Studio with `webServer`.
- Both supported local hostnames retained local-server behavior.
- Explicit public `BASE_URL` selected deployed metadata with no `webServer`.
- Workflow inspection confirmed the explicit public fallback.
- Discovery without `BASE_URL`: **10 desktop, 8 mobile, 18 total across 8 files**.
- Public website fingerprint remained unchanged.

The fresh E2E run is performed by the main agent. Record its actual results separately; these syntax, configuration, and discovery checks are not E2E passes.
