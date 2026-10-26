# Cloud development setup and validation — 2026-10-26

The newer local foundation workspace runs successfully in the current Ubuntu execution environment, including all 18 Playwright instances. The published branch named `feature/ai-agent-foundation` is an older baseline and does not yet carry the full agent foundation. A hosted cloud workspace, public preview, or deployment was not provisioned or verified.

Status: local dependency setup and validation complete; recommendations below are proposed, not implemented. Application functionality, agent configurations, tests, CI, historical QA records, and lockfiles were preserved.

## Repository and branch evidence

Repository: [vladstr86/qa-demo-shop](https://github.com/vladstr86/qa-demo-shop).

| Scope | Branch / revision | Observed state |
| --- | --- | --- |
| Original workspace | `chore/qa-shop-agent-foundation`, `63b9f5d` | Four commits ahead of the published foundation baseline; existing uncommitted/untracked agent and DevOps preparation was present before this task |
| Published foundation candidate | [`feature/ai-agent-foundation`](https://github.com/vladstr86/qa-demo-shop/tree/feature/ai-agent-foundation), `5b3991c258ab1ad23ea53a24fa9c26cfec1228b2` | GitHub comparison with `main` returned `identical`, zero commits ahead/behind and no differing files |
| Isolated validation checkout | Local `chore/cloud-development-validation`, `5b3991c` | Created from the published candidate without switching, merging, stashing, or overwriting the original workspace |

The original workspace's Product Manager, Software Architect, root agent configuration, multi-agent governance, product/architecture documents, and DevOps preparation are not established by the published candidate. They must not be described as available in a fresh clone of that branch.

The isolated checkout is `/tmp/qa-shop-cloud-20261026-nwzdzqnq/foundation`. Git fetch and local worktree/branch creation were the only Git setup actions. No commit, push, PR, merge, deployment, live migration, or external resource creation occurred.

## Instructions and actual agent support

Reviewed `AGENTS.md`, `qa/WORKFLOW.md`, `docs/agents/devops.md`, `docs/workflows/multi-agent.md`, the historical foundation validation report, `.codex/config.toml`, and every existing `.codex/agents/*.toml` file. The original workspace has three configured specialists:

| Actual agent type invoked | Task | Actual result |
| --- | --- | --- |
| `product_manager` | Scope, governance, role preservation, and published-branch comparison | Returned read-only findings and acceptance evidence |
| `software_architect` | Runtime boundaries, configuration/service prerequisites, and cloud/Ubuntu recommendations | Returned source-based read-only findings |
| `qa_coordinator` | Playwright configuration, coverage, fixture privacy, and execution recommendations | Returned read-only findings; no new website prompt was needed |

All three exact role types spawned successfully and returned results in this session; no generic substitute was used. They created no nested agents. The Orchestrator performed installation, execution, and reporting. The Product Manager confirmed project-specific role instructions loaded.

Four original-workspace TOML files parsed successfully. The root configuration enables agents and limits concurrent subagents to three, excluding the primary thread. The single agent TOML in the published baseline also parsed successfully, but that baseline contains only `qa_coordinator`: PM, Architect, and `.codex/config.toml` are absent. Fresh-session discovery from that isolated checkout was not tested.

The PM and Architect remain advisory. QA retains exact ID/revision approval and source/prompt fingerprint gates. Read-only inspection verified `QA-006 r1` fingerprints in the original workspace; its manifest remains `pending`, and no prompt was applied or dispatched.

Custom agent files inherit parent permissions. The coordinator's preserved `sandbox_mode` field does not establish a separate enforced sandbox. This session uses the client-selected full filesystem access and no permission escalation; project defaults do not change those effective permissions. Official [OpenAI subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) describes standalone agent TOML files and permission inheritance. A clean hosted workspace's role discovery and permission configuration remain unverified.

## Actual execution results

Observed environment: Ubuntu 24.04.5 LTS, Linux x86_64, Node.js `24.7.0`, npm `11.5.1`, Python `3.12.3`, Codex CLI `0.164.0-alpha.11.1`. These are this execution host's versions, not a claim about a separately provisioned cloud image. Previous documentation's CLI version and test evidence remain historical.

Both lockfiles use format 3 and resolve Playwright `1.64.0`. The newer workspace additionally resolves Supabase JS `2.117.3`, PGlite `0.5.8`, and esbuild `0.28.2`. The package version remains `1.0.0`; this task did not implement a new 2.0 application release.

| Check | Newer original workspace | Published baseline in isolated checkout | Limit |
| --- | --- | --- | --- |
| `npm ci` | Passed: 40 packages added, 41 audited | Passed: 3 packages added, 4 audited | Both reported zero vulnerabilities; no dependency upgrade or lockfile change |
| `npx playwright install chromium` | Passed; matching browser cache was already present | Same locked Playwright/browser revision | No OS packages were installed; a clean-machine OS bootstrap was not tested |
| JavaScript syntax | 32 files passed | 22 files passed | Tracked application, scripts, POM, fixture, test files and Playwright config; not browser E2E |
| TOML parsing | 4 passed | 1 passed | Parsing alone does not establish discovery or isolation |
| Existing DevOps preflight | Passed | Unavailable in this revision | Checked Node 24, tracked public syntax, ignore rules, empty account config and discovery |
| Playwright discovery | 10 desktop + 8 mobile | 10 desktop + 8 mobile | 18 instances per checkout; discovery is not an E2E pass |
| Existing Node tests | 35 passed, 0 failed/skipped | 12 passed, 0 failed/skipped | Account client, QA handoff and fixture helpers as available in each revision |
| Disposable database checks | 12 passed, 0 failed | Unavailable in this revision | Synthetic in-memory PGlite; no live Supabase or PostgreSQL concurrency validation |
| Full browser E2E | 18 passed: 10 desktop + 8 mobile; 0 failures, retries disabled | Not run | Older baseline has legacy fixed fixtures without the newer fictional-data loader; its full suite was not exercised with those values |
| `npm start` + HTTP smoke | Passed: `/`, `/app.js`, `/style.css` each HTTP 200 | Passed: same paths each HTTP 200 | Separate local ports; servers stopped after verification |
| Chromium startup/render smoke | Passed: 6 product cards, 0 uncaught JavaScript errors | Passed: 6 product cards, 0 uncaught JavaScript errors | Fresh browser contexts; external requests blocked and ignored local configuration bypassed |
| QA fingerprint review | `QA-006 r1` valid; status unchanged | Not run | No approval or dispatch inferred |
| Diff whitespace/preservation | Passed | Passed; isolated worktree clean | All 209 pre-existing non-ignored workspace files retained identical SHA-256 hashes |

No executed project check failed. Non-fatal browser-run output warned that `FORCE_COLOR` overrides `NO_COLOR`; it did not affect results. The published baseline's smoke blocked an external request; its CSS references Google Fonts. Rendering succeeded without that external font service. The newer workspace smoke made no external requests.

Playwright remains JavaScript ESM/POM with Chromium desktop at 1440×900 and mobile at 390×844. Mobile excludes `*.desktop.spec.js`. RO/EN share cases, and the existing 18-instance contract was preserved.

The newer-workspace E2E run completed in approximately 69 seconds against `http://127.0.0.1:4197/`, with two workers and zero retries. The launcher removed inherited `QA_*`, `BASE_URL`, and `PORT` overrides, then set `CI=true`, `QA_USE_LOCAL_TEST_DATA=0`, `PLAYWRIGHT_HTML_OPEN=never`, and the explicit local URL. Account endpoints were intercepted by the existing fixture. Browser success proves mocked/local integration, not live accounts, actual delivery, or real payments.

Commands executed included:

```bash
npm ci
npx playwright install chromium
npm run devops:preflight
node --test scripts/qa-handoff.test.mjs test-data/shop.test.mjs scripts/account-client.test.mjs
npm run test:database
npm run test:local -- --project=chromium-desktop --project=chromium-mobile --workers=2 --retries=0 --output=/tmp/qa-shop-cloud-20261026-nwzdzqnq/current-test-results --reporter=line,html
```

The isolated older checkout used `npm ci`, `node --test scripts/qa-handoff.test.mjs test-data/shop.test.mjs`, and `npx playwright test --list --reporter=line`, with the same explicit local targeting and non-interactive reporter settings. Additional syntax and browser/server smoke helpers were temporary files outside the repository.

Execution logs and check metadata are under `/tmp/qa-shop-cloud-20261026-nwzdzqnq/`. The newer run's HTML report is `current-html/index.html`; test output is `current-test-results/`. These temporary paths are local evidence, not durable cloud artifacts or uploaded resources.

## Environment variables and services

No required environment variable or external service is missing for local guest/mock operation. The newer workspace's static site, photographs, and browser account SDK are already in maintained `dist/`; a general application build is not required. `build:account-sdk` regenerates maintained vendor output and was deliberately not run.

| Purpose | Configuration names | Required for baseline? |
| --- | --- | --- |
| Server/test selection | `PORT`, `BASE_URL`, `CI`, `PLAYWRIGHT_HTML_OPEN` | No; defaults exist. An explicit local `BASE_URL` is necessary to avoid the older branch's deployed default |
| Fictional/private fixture selection | `QA_USE_LOCAL_TEST_DATA` | No; newer checkout supports fictional defaults and CI isolation |
| Optional fixture overrides | `QA_CUSTOMER_NAME`, `QA_CUSTOMER_EMAIL`, `QA_CUSTOMER_ADDRESS`, `QA_CUSTOMER_BILLING`, `QA_CARD_NUMBER`, `QA_CARD_EXPIRY`, `QA_CARD_CVV`, paired `QA_LOGIN_EMAIL` / `QA_LOGIN_PASSWORD` | No; available in the newer loader, not the legacy published baseline |
| Optional real accounts, browser JSON fields | `url`, `publishableKey`, `confirmationPolicy`, `emailRedirectTo` | Only for optional real Supabase features in the newer checkout; tracked `url` and `publishableKey` are empty |

The newer application reads account JSON configuration, not invented `SUPABASE_*` environment variables. Browser-served configuration must contain only public browser-safe values. `.env` files are not loaded automatically. No environment or credential values were copied into this report.

Unverified prerequisites for optional real accounts are the live schema/catalog baseline, reviewed migration state, Auth/email and redirect settings, grants/RLS, and multi-connection behavior. No Supabase project was contacted or created. Public shop/analytics destinations and Cloudflare hosting were not tested. GitHub environment secrets and protection settings were not audited, so they are unverified rather than confirmed missing.

`DEVOPS-AGENT.md` and `DEVOPS-SETUP.md` remain unavailable at the reference paths in `docs/agents/devops.md`. Their integration and preview/production workflow requirements remain pending. No deployment secrets or production credentials are needed for this local setup.

## Proposed cloud and Ubuntu 24.04 adjustments

1. Resolve the source-of-truth gap first: preserve and review the existing local foundation work, then make the intended complete revision available through separately authorized Git actions. The published branch name currently points to the original main baseline. Do not begin a fresh cloud session assuming all three role files exist there.
2. Match the existing Node.js 24 CI baseline in cloud development and Ubuntu. Consider `.nvmrc` or `.node-version` plus an `engines` declaration in a future scoped configuration change. No runtime pin was added here.
3. Bootstrap the selected revision using `npm ci` and `npx playwright install --with-deps chromium`. The latter is the official [Playwright browser/system-dependency installation command](https://playwright.dev/docs/browsers). Ubuntu 24.04 is listed in [Playwright's supported systems](https://playwright.dev/docs/intro). This run reused installed OS libraries, so fresh-machine package installation remains untested.
4. Set an explicit local `BASE_URL`, `PLAYWRIGHT_HTML_OPEN=never`, and two workers in headless tasks. In the newer checkout, use `CI=true` and clear `QA_*` overrides to ensure fictional fixtures. Existing reporter configuration uses `open: 'always'`; an environment override is sufficient for these checks. Preserve private fixtures and do not copy legacy personal data into new templates.
5. Verify the selected platform's preview/port-forwarding mechanism. The existing server binds `127.0.0.1` and honors `PORT`, but does not implement a configurable `HOST`. If the platform requires an all-interface listener, propose that small server change separately. Hosted preview access was not tested.
6. Start a fresh agent session from the eventual complete checkout and verify all three exact role names again. Preserve concurrency, parent permission controls, QA approvals/fingerprints, and models inherited from the user's settings. Project configuration is not a permanent watcher or a VS Code dispatch integration.
7. Keep local-workspace verification separate from the existing GitHub Actions job, whose default target is the public deployment. A successful local run does not verify that remote job or deployed content. No CI changes were made.

After selecting the complete newer revision, a reproducible shell without existing private `QA_*` overrides can use:

```bash
npm ci
npx playwright install --with-deps chromium
CI=true QA_USE_LOCAL_TEST_DATA=0 PLAYWRIGHT_HTML_OPEN=never npm run devops:preflight
CI=true QA_USE_LOCAL_TEST_DATA=0 BASE_URL=http://127.0.0.1:4173/ PLAYWRIGHT_HTML_OPEN=never npm run test:local -- --workers=2 --retries=0
npm start
```

These commands are instructions for a future clean setup, not evidence that a hosted image, Ubuntu installation, or remote automation was configured. The older published baseline lacks `devops:preflight`, `test:local`, the fictional loader, optional account modules, and the full agent configuration.

## Changes, review, and next action

Only this report was added to repository files by this task. Dependencies were installed in ignored `node_modules/` directories; temporary execution artifacts and the isolated checkout remain outside the original workspace. All pre-existing staged/unstaged/untracked project work was preserved. No application functionality, role, source fingerprint, test, package manifest, lockfile, CI workflow, global Git/SSH setting, or service configuration was changed.

The configured `qa_coordinator` independently reviewed this report against source and saved execution evidence and found no material issues. It confirmed the counts, local/hosted distinctions, setup command scope, and preserved QA approval gates. It did not rerun tests, audit live services, or independently verify remote branch state or all preservation hashes; the Orchestrator verified the latter through GitHub comparison and the 209-file fingerprint baseline.

Next action: review this evidence and select the intended complete foundation revision for a future fresh cloud checkout. Making the uncommitted foundation available remotely requires separate commit/push authorization. Hosted preview, clean-image bootstrap, headed/UI mode, Firefox/WebKit, live Supabase, GitHub Actions, protected environments, deployment, and user acceptance remain untested.
