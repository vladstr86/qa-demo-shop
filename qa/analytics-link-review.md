# Localized analytics navigation review

Date: 2026-10-09. Project: `/home/vlad/ProjectDemo/qa-demo-shop-update/qa-demo-shop`.

## Change

One native `<a>` with `data-testid="analytics-link"` was added after the hero illustration. It reuses the existing primary/link-button styling and occupies the existing bottom padding of the hero. Scoped mobile sizing keeps it within that gap. Existing controls and elements were not moved.

The existing shell renderer calls `renderAnalyticsLink()` to update the label and destination on initialization, header/dialog language changes, and reload. The original catalog link remains the first `.hero .link-button` and keeps its existing behavior.

| Language | Label | Destination |
| --- | --- | --- |
| Romanian | Analiză date | https://vlad-qa-analytics.pages.dev/?lang=ro |
| English | Data Analytics | https://vlad-qa-analytics.pages.dev/?lang=en |

The anchor has no target, download attribute, custom click handler, or window-opening behavior. It uses normal same-tab navigation. Its destination includes only the language parameter. No Supabase, checkout, backend, tracking, payment, dependency, or configuration changes were made.

## Local verification

Before editing, `npm run qa:review` validated the existing QA-003 r1 record and fingerprints. The current user request directly authorized the navigation change; the pending historical handoff was not applied or dispatched.

- JavaScript syntax and `git diff --check` passed.
- Existing POM/specification/fixture/data/configuration checksums remained unchanged.
- Removing the new analytics rendering helper and its shell call restores the application JavaScript exactly to HEAD; removing the anchor restores the HTML exactly.
- Before/after layout comparison at widths 320, 360, 375, 390, 430, 700, 701, 900, 1200, and 1440 in RO/EN covered **20 states**. All 163 existing element rectangles, normalized DOM hashes excluding the new anchor, page widths, and hero/illustration/notice bounds remained identical. The new button fits the existing gap and viewport.
- Desktop/mobile browser checks verified both exact labels and URLs, same-tab mouse navigation, English keyboard Enter navigation, visible keyboard focus, persisted language after reload, and updates from dialog language controls. Exactly one page remained open.
- Analytics destination requests were intercepted locally with a controlled HTML response to inspect the URL and tab behavior. These checks did not test the remote analytics application's availability or features.
- Discovery remained **10 chromium-desktop + 8 chromium-mobile = 18**. No permanent tests or snapshots were rewritten or added.

The unchanged browser suite ran against **http://127.0.0.1:4194** with fictional fixtures and completed in **53.7 seconds**:

| Project | Passed | Failed | Skipped | Not run |
| --- | ---: | ---: | ---: | ---: |
| chromium-desktop | 10 | 0 | 0 | 0 |
| chromium-mobile | 8 | 0 | 0 | 0 |

There were zero flaky cases and no unresolved failures in the executed suite. Temporary browser checks stayed outside permanent test discovery. The generated report and results remain ignored.

Re-run the unchanged local suite:

```bash
BASE_URL=http://127.0.0.1:4194 QA_USE_LOCAL_TEST_DATA=0 PLAYWRIGHT_HTML_OPEN=never npm test -- --project=chromium-desktop --project=chromium-mobile --workers=2
```

## Coordinator and changed files

The read-only coordinator found no blocking source, selector, or native-navigation defect. The English [QA-004 r1 prompt](prompts/QA-004-ANALYTICS-LINK.md) was prepared with `npm run qa:prepare -- qa/prompts/QA-004-ANALYTICS-LINK.md QA-004 1`. Its status is **pending**. It was not dispatched or separately applied.

Website changes: `dist/index.html`, `dist/app.js`, and `dist/style.css`.

QA records: `qa/prompts/QA-004-ANALYTICS-LINK.md`, `qa/latest.json`, `qa/.handoff-records/QA-004-r1.json`, and this review.

This navigation change remains uncommitted and unpushed for the user's later review. Existing prior commits were left intact. No deployment, merge, history rewrite, or global Git/SSH change was performed. No GitHub Actions success is claimed.
