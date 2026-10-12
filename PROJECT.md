# QA Demo Shop — project brief

A static bilingual Romanian/English shop for practicing manual QA and Playwright automation with JavaScript ESM. The user reviews the website and test evidence. English is the permanent language for project work; localized website text and test expectations remain bilingual.

## Scope

- Six products; category, search, multiple-brand, and stock filters.
- Required variant choices, variant pricing, unavailable combinations, and quantity limits.
- The approved white, graphite, and sage Studio theme, with an Atlas hero and language-aware analytics navigation.
- Eighteen attributed real photographs: three gallery views per product, thumbnails, navigation, and zoom. Photos remain unchanged when selecting color variants.
- Cart additions, variant separation and merging, quantity changes, removal, persistence, and reset.
- Mock login, tab-session authentication, persistent remember me, and logout.
- Separately configured Supabase registration/sign-in, confirmation states, and memory-only real-account sessions.
- Owner-protected contact profiles with phone and structured shipping/billing addresses; editable checkout prefill.
- Explicit local guest/mock orders and authenticated stored demo orders with validated confirmations, stable retry IDs, owner history, and aggregate refresh.
- Guest and authenticated three-step checkout: address, shipping/payment, review.
- Separate billing, optional newsletter, required terms, and simulated cash/card payments.
- Fixed EUR prices, exactly two decimals, integer-cent subtotal/shipping/total calculations.
- Preserved values, variants, quantities, and checkout data when switching RO/EN.
- Desktop/mobile layouts without horizontal overflow.

The default checkout remains local because the tracked Supabase configuration is empty. The optional real-account mode requires the reviewed additive migration and browser-safe configuration; payments and delivery remain simulated. SQL/configuration steps are prepared in [qa/account-orders-configuration.md](qa/account-orders-configuration.md), with no live application performed.

The separate mock account is advertised by the demo website. Fictional positive customer and dummy-card defaults are centralized in `test-data/shop.example.json`; `test-data/shop-data.js` loads optional ignored local data or environment overrides. The website loads its mock account from `dist/demo.example.json`, with an optional ignored `dist/demo.local.json` override. The optional `dist/account-config.local.json` is also ignored. Routine account tests use fictional Auth/API mocks and an isolated database compatibility harness.

## Automated acceptance coverage

The approved QA-001 r1 implementation consolidates useful existing coverage into eight shared cases and two desktop-only cases, rather than adding language projects or skipped mobile cases. Test evidence, remaining limitations, and the coverage map are in [qa/QA-001-r1-review.md](qa/QA-001-r1-review.md). Automated success does not imply the user's manual acceptance.

User review remains required for:

- [ ] Manual review of the bilingual website and responsive presentation.
- [ ] Review of the implementation, test coverage, and actual verification evidence.
- [ ] Acceptance of the delivered demo.

## Roles and workflow

The project manager defines scope and criteria; developers implement authorized changes; testers write and run meaningful checks; the QA Change Coordinator analyzes website changes read-only and drafts a versioned prompt; the user approves the exact prompt and reviews the outcome.

Follow [AGENTS.md](AGENTS.md) and [qa/WORKFLOW.md](qa/WORKFLOW.md). Validate prompt and website fingerprints with `npm run qa:review` before editing. QA-001 r1 has conversation approval; preserve its original prompt as the historical record. There is no external watcher or confirmed direct dispatch to VS Code. Do not commit, push, merge, deploy, or change global Git/SSH settings as part of this work.

Future coupons, APIs, additional browser engines, and other features require a separate agreed scope.
