# Agent foundation validation — 2026-10-26

Status: completed and validated locally. This report covers local preparation for QA Demo Shop 2.0, with no application implementation or approved 2.0 architecture.

Dedicated local branch: `chore/qa-shop-agent-foundation`, created from `feat/store-theme-and-analytics-link` without discarding existing working-tree changes. No commit, push, PR, merge, deployment, live migration, external ticket/project creation, or global Git/SSH changes were performed.

## Audit and preservation

Before edits, inspected `AGENTS.md`, the existing `.codex/agents/qa_coordinator.toml`, `qa/WORKFLOW.md`, project structure, current runtime/test/database/CI contracts, and `docs/agents/devops.md`. Project `.codex/config.toml` did not exist. The only configured custom role was `qa_coordinator`; DevOps was a documentation role. Independent audit delegates examined QA governance and source structure read-only.

Existing local changes to `AGENTS.md`, `README.md`, `package.json`, the DevOps documentation, preflight script and workflow were retained. A pre-task SHA-256 baseline covered 196 tracked or non-ignored local files. Of those files, only `AGENTS.md` was intentionally changed, by appending governance after the exact original bytes. All other baseline files remained unchanged, including the coordinator, `dist/`, test suite/POMs/fixtures, database files, CI, lockfile and QA records. New files are listed below. Private ignored fixtures were not inspected or published.

`npm run qa:review` succeeded. Direct review returned `QA-006 r1`, unchanged `pending` manifest status, and valid prompt/site fingerprints. That existing status describes the CLI handoff and does not establish whether a historical conversation approval exists. No approval was inferred, recorded or replaced. No new QA prompt is required for configuration/documentation-only work.

## Files and roles

Created:

| Files | Purpose |
| --- | --- |
| `.codex/config.toml` | Supported agent settings, three-subagent cap and defaults for new parent sessions |
| `.codex/agents/product_manager.toml` | Advisory PM requirements, Agile/backlog, acceptance, release and GitHub preparation role |
| `.codex/agents/software_architect.toml` | Advisory source-based architecture, domain, ADR/C4/API/data and incremental migration role |
| `docs/product/README.md` | Local product workflow, stable IDs, future ticket template and requirements traceability |
| `docs/product/github-projects-plan.md` | Proposed Kanban fields, statuses, views, automation and future capability/authorization checks |
| `docs/workflows/multi-agent.md` | Routing, ownership, approvals, reviews, operating limits and read-only smoke tasks |
| `docs/workflows/agent-foundation-validation.md` | This report |
| `architecture/README.md`, `architecture/migration-plan.md` | Documentation workspace and planning prerequisites; no chosen target architecture |
| `architecture/{adr,diagrams,api,database}/.gitkeep` | Preserve empty documentation directories in a future authorized commit |

Modified by this task: `AGENTS.md` only. The main Codex agent is the AI Orchestrator; it is governed there rather than duplicated as a custom subagent. `qa_coordinator` is preserved unchanged. Developer, Security, Backend, Frontend, UI/UX and QA execution are bounded responsibilities, not newly installed custom roles. No third-party skills or dependencies were installed.

## Configuration and discovery evidence

Installed client: `codex-cli 0.162.0-alpha.17.2`. Current [official subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) and [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) were fetched before selecting the supported format.

- Python 3 `tomllib` parsed all four project TOML files successfully, including the unchanged coordinator.
- A temporary `codex --strict-config app-server --listen stdio://` process successfully answered `initialize` and `config/read` for this repository. The project layer was enabled; effective agent settings were `enabled = true` and `max_concurrent_threads_per_session = 3`. Effective project parent defaults were `workspace-write`, `on-request`, and shell network access disabled. Existing user configuration stayed present and unchanged.
- `codex debug prompt-input` successfully rendered all three exact custom role names: `qa_coordinator`, `product_manager`, and `software_architect`.
- This already-running chat's role snapshot rejected an initial `product_manager` spawn as an unknown type. A fresh local CLI session discovered and used both new types. Configuration edits do not guarantee hot reload of an existing client's tool schema.

The project concurrency limit excludes the primary thread. Specialists cannot create nested agents under their instructions. Models/reasoning inherit the user's existing choices.

Custom agents inherit parent permissions and MCP servers. PM/Architect disable supported app/plugin/permission-request capabilities, but this does not establish a separate filesystem sandbox or a complete external-tool firewall. The coordinator's preserved `sandbox_mode` key cannot override its parent in this client. For actual filesystem restrictions, the smoke test used a **parent** session with `--sandbox read-only --ask-for-approval never`; shell networking was restricted. Hosted tool/service permissions remain separate. This chat's externally selected permission mode was not changed by writing project defaults.

## Actual read-only delegation

A fresh normally persisted local CLI invocation used `--no-daemon`, `exec --strict-config --sandbox read-only --json`, and approval policy `never`. It completed with exit code 0. Parent transcript spawn calls and successful tool returns confirmed these exact configured roles, without generic substitutions or model overrides:

| Configured type | Actual delegated task | Result |
| --- | --- | --- |
| `product_manager` | `/root/product_smoke_test` | Completed read-only document inspection; returned proposed GIVEN/WHEN/THEN template, traceability and three Projects preparation questions |
| `software_architect` | `/root/architecture_smoke_test` | Completed read-only source inspection; returned current boundaries, three evidenced risks, missing live evidence and incremental planning prerequisites |

PM read `AGENTS.md`, `PROJECT.md`, both product documents and the QA workflow. It confirmed these are proposals rather than an approved backlog or active board. Its questions concern intended owner/repository/project, available Projects operations/permissions, and actual requests/existing configuration to reuse. Available GitHub tool metadata does not expose Projects operations; no remote capability audit or mutation was performed. Local planning is ready; live Projects integration remains unverified.

Architect inspected the requested entry point, actual catalog/totals/checkout/order/language/reset code, all three account modules, package/project scope, migration and compatibility harness. Current facts: `app.js` combines storefront concerns; account UI/runtime/client modules form an existing seam; optional Supabase SQL provides owner policies and wrappers around legacy functions. There is no separate Admin or Node application backend in the inspected application. Payments remain simulated and real-account sessions memory-only.

Architect's three risks were catalog harness dependence on the precise `products`/`variant` source shape, migration dependence on existing functions/privileges with unverified live compatibility/concurrency, and separate account-contact/address writes that can partially succeed. These are analysis findings, not implemented fixes. Proposed next prerequisites are approved stories/ADRs, reversible boundaries and targeted Security/DevOps/QA review. Live schema/functions, grants/RLS, catalog compatibility, Auth configuration, concurrency and hosting/GitHub protections remain unverified.

Neither specialist changed files, Git state, prompts, external artifacts or live systems. Neither created nested subagents. Their source inspection is not a test or production audit.

## Checks and observed tooling limits

| Check | Passed | Failed | Not run / limitation |
| --- | --- | --- | --- |
| TOML parsing | 4 files | 0 | Syntax alone is not runtime discovery |
| Strict app-server configuration read | Yes | 0 | Local effective settings, not remote protections |
| Exact configured-role discovery/delegation | Both new specialists | 0 in final persisted run | Existing chat requires a fresh role snapshot |
| Existing QA handoff tests | 9 | 0 | Includes exact approval, drift, immutable revisions and dispatch-error behavior |
| QA prompt and public site fingerprints | Valid | 0 | QA-006 r1 records unchanged |
| Existing DevOps local preflight | Passed | 0 | Public JS syntax, ignore rules and Playwright discovery only |
| Playwright discovery | 10 desktop / 8 mobile | 0 | 18 instances; discovery is not E2E |
| Existing local browser suite | 18: 10 desktop / 8 mobile | 0 | Local target; fictional fixture loading and mocked account endpoints; 2.4 minutes |
| Documentation links, whitespace and preservation | Passed | 0 | All original files preserved except the additive AGENTS.md update |
| Independent configuration/governance review | No material findings | 0 | Read-only reviewer; no remote/security enforcement audit |
| Remote GitHub/Projects, protected environments, deployment and live DB | — | — | Not run; outside configuration scope |

The existing QA tests ran with `node --test scripts/qa-handoff.test.mjs`. Local preflight ran with `npm run devops:preflight`. Browser verification ran the unchanged `npm run test:local` with two workers, zero retries, the line reporter and a temporary output directory, targeting `http://127.0.0.1:50355/`. Its environment cleared existing `QA_*` overrides and set `CI=true`, `QA_USE_LOCAL_TEST_DATA=0`; the fixture intercepted account configuration/Auth/API endpoints. No live account/database/payment calls were used. This is local E2E evidence, not a deployed-site check or user acceptance.

The independent reviewer found no material role, approval, architecture-scope or permissions-description conflicts. Completion checks confirmed the final report exists and all four hidden `.gitkeep` placeholders are present. Temporary smoke transcripts, redacted spawn evidence and E2E logs remain outside the repository in the local task workspace; no generated test artifacts or credentials were added to tracked files.

Observed preliminary/tooling failures, with recovery:

- `--strict-config` is unsupported for `codex features`; validation used the supported strict app-server and `exec` paths instead.
- An initial `--ephemeral` CLI run failed parent-context spawning with `no rollout found`. A self-contained retry made partial progress, but the run was stopped; its results are not counted as the completed two-role smoke test. Normal local session persistence completed both roles without spawn errors. Use that mode for repeatable validation on this installed build.
- One Architect helper called unavailable `python` and exited 127. Direct source reads recovered the inspection; Python 3 is installed. No packages or aliases were changed.

## Remaining decisions and next work

Start a fresh local Codex session when selecting the new roles; use a read-only parent for enforced advisory inspection. Ask PM to refine one concrete 2.0 outcome, then Architect to propose bounded alternatives/ADRs grounded in the existing source. Those future stories and decisions require their own scope approval before significant implementation.

GitHub Projects preparation remains local until the intended target, supported capabilities and exact remote action authorization exist. No active board, issue synchronization, persistent watcher or VS Code dispatch integration is claimed. Requested DevOps reference guides and actual live database evidence remain unavailable/unverified as recorded in the existing DevOps instructions; this configuration does not resolve those prerequisites or establish release readiness.
