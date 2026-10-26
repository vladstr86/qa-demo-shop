# QA Demo Shop — agent instructions

## Permanent language rule

Use English for agent communication, plans, reports, prompts, project documentation, test names, code identifiers, comments, and configuration descriptions. This rule applies to future work and overrides older agent configuration that requests Romanian output. Preserve the website's Romanian/English interface and localized expected strings in tests. Keep already approved QA prompts unchanged as historical approval records; write new prompts in English.

## Project

Static shop in `dist/`, JavaScript ESM. Playwright tests are in `tests/`, POMs in `pages/` and `components/`, fixtures and data in `fixtures/` and `test-data/`.

Existing commands: `npm start`, `npm test`, `npm run test:ui`, `npm run report`. Respect the user's configuration and compatible local changes.

## DevOps role

Follow [docs/agents/devops.md](docs/agents/devops.md) for CI, preflight, build output, deployment, and migration preparation. It supplements all existing instructions. Use GitHub environment secrets, report missing configuration by name only, and keep production jobs bound to the protected `production` environment. Preserve existing tests, ignored fixtures, and company SSH settings. Preparation does not authorize deployment, live migrations, data deletion, commit, or push. The requested DevOps reference guides are currently unavailable; their integration and preview/production workflow requirements remain pending.

## QA Change Coordinator

The user explicitly requested this agent and delegation: after each authorized change to website behavior, UI, or assets, use `qa_coordinator` to analyze the differences and draft a Codex prompt for updating local implementation and tests.

- Agent configuration: `.codex/agents/qa_coordinator.toml`; full workflow: `qa/WORKFLOW.md`.
- The coordinator analyzes read-only. The main agent saves its result in `qa/prompts/` with an ID and revision, then runs `npm run qa:prepare -- <prompt> <id> <revision>`.
- Present the full prompt or a file link and concrete summary. Its initial status is `pending`.
- Dispatching to Codex and applying the implementation/tests described in a prompt require explicit user approval of that exact ID/revision. Creating an agent or approving another version does not approve this prompt.
- For manual application in VS Code too, run `npm run qa:review` before editing and confirm the approved ID/revision. If fingerprints fail or the version differs, stop application and prepare an updated prompt for review.
- After exact approval, continue within the approved scope without routine reconfirmation. If the prompt, requirements, or website source changes, prepare a new revision and present it for approval.
- Prompt preparation, documentation, tests, and ZIP regeneration do not trigger another website prompt. This prevents recursive generation.
- If delegation is unavailable in the client, the main agent performs the same role and states that fallback.
- These instructions apply during agent work; configuration files do not start a permanent watcher. Do not claim a prompt was sent to VS Code without a confirmed integration.

## Test contract

- JavaScript ESM, Playwright, and Page Object Model. Keep interactions and locators in POMs; keep assertions in tests.
- Prefer centralized CSS locators: `page.locator()` / `root.locator()`, `[data-testid="..."]`, IDs, and stable attributes. Scope to the relevant dialog/row. No XPath or fixed waits.
- Maximum 10 desktop cases at 1440×900 and 8 mobile cases at 390×844; maximum 18 discovered instances across both projects. Test RO/EN in the same cases. Do not inflate discovery with skipped mobile scenarios or additional language projects. Exclude `*.desktop.spec.js` from mobile discovery.
- Inspect the local suite before modifying it: the reference archive may have more scenarios than a local reduced suite. Integrate/regroup useful coverage before adding cases.
- Currency is EUR with exactly two decimal places. Application and expected calculations use integer cents. Independently recalculate expected subtotal from displayed unit prices and quantities; do not import application calculations.
- Fixed positive data comes from the fictional tracked `test-data/shop.example.json`, with optional ignored local fixtures or `QA_*` environment overrides through `test-data/shop-data.js`. Keep personal values and demo credentials out of tracked files and documentation. CI ignores local fixtures. Resolve mock login separately from explicit overrides or the site's advertised demo account; never use customer details as login credentials.
- Negative flows copy common positive data, invalidate one relevant field, then restore valid data. Never mutate the common object.
- Check syntax and discovery; run E2E where the environment permits. Report passed/failed/not run separately. Node checks and `--list` are not passed E2E tests.
- Applying a QA prompt does not authorize commit, push, merge, deploy, global Git/SSH changes, or real payments.

## AI Orchestrator and specialists

The main Codex agent is the AI Orchestrator. It owns task intake, delegation, dependencies, approval tracking, integration, and the consolidated report. Use [the multi-agent workflow](docs/workflows/multi-agent.md) for routing, review, traceability, and operating limits. This governance supplements the existing QA and DevOps rules above.

| Role | Responsibility | Boundary |
| --- | --- | --- |
| AI Orchestrator (main agent) | Establish authorized scope, select specialists, assign ownership and deliverables, collect evidence, integrate approved work. | Cannot grant user approval or override QA fingerprints, tool permissions, or branch/environment protections. |
| `product_manager` | Requirements, Agile backlog, epics/stories, acceptance criteria, priorities/dependencies, release planning, local GitHub Issues/Projects proposals, UI/UX handoffs. | Advisory; returns drafts. No file edits or remote GitHub changes. |
| `software_architect` | Inspect current code, identify debt, propose domain/system boundaries, ADRs/C4/API/database designs and incremental migration strategies. | Advisory; returns drafts after inspection. No code refactoring, SQL application, or infrastructure changes. |
| `qa_coordinator` | Existing read-only website change analysis and versioned QA prompt preparation. | Existing exact ID/revision approval and fingerprint workflow remains authoritative. |
| DevOps | Existing preparation and verification responsibilities in `docs/agents/devops.md`. | Documentation role; unavailable reference guides and release requirements remain pending. |

Developer, QA execution, Security, Backend, Frontend, and UI/UX responsibilities may be assigned as bounded tasks using available agents; they are not additional configured custom roles. Report the actual agent type used and any fallback. Do not claim a specialist ran merely because instructions exist.

### Delegation and ownership

- Use at most three concurrent subagents, excluding the main agent, across the task. Specialists return work to the Orchestrator and do not create nested subagents.
- Delegate only when independent work or specialist review helps. Keep short/dependent work in the main agent; reuse existing findings and request concise evidence instead of repeated broad audits.
- Each assignment states objective, authorized scope, owned files or read-only boundary, inputs, dependencies, expected deliverable, checks, and approval limits. Workers share the checkout: explicitly tell them they are not alone, to preserve others' edits, and to coordinate overlapping files.
- Give each edited file one active owner. Resolve dependent requirements/architecture decisions before implementation; parallelize independent reads or disjoint edits only. Preserve compatible local work.
- The Orchestrator may persist advisory drafts in authorized documentation paths; the draft's status remains proposed until approved. Agent capability descriptions are expertise instructions, not installed third-party skills or proof of service access.

### Approval and review

- The current agent-configuration task authorizes local configuration, documentation, validation, read-only delegation, and a dedicated local branch. It authorizes no Storefront/Admin behavior changes, refactoring, CI changes, external tickets/projects, or production operations.
- For future significant changes to behavior, architecture, data contracts, dependencies, or infrastructure, prepare a concrete scope/decision for user approval before implementation unless the exact scope is already explicitly authorized. Routine reversible work within approved scope needs no repeated permission.
- Product and architecture recommendations are not implementation approval. New website changes still trigger the existing QA coordinator workflow; applying a QA prompt still requires approval of its exact ID/revision and `npm run qa:review` before edits. Changed scope/source requires a new revision.
- Before delivery, review the diff for correctness, regressions, scope, privacy, security, and preserved local changes. Use an independent reviewer for substantive implementation; report reviewer limitations and resolve material findings.
- Obtain architecture review before cross-domain refactoring, new runtime/frameworks, API/schema/auth changes, or migration strategies. Record consequential decisions as proposed ADRs in `architecture/adr/`, including alternatives, verification, rollback, and user approval evidence before implementation.
- Apply QA gates appropriate to the change: syntax/configuration/discovery checks, relevant existing unit/integration checks, and browser E2E for behavior changes when available. Preserve the test contract. Report passed, failed, and not run separately.
- Review security when changes affect authentication, authorization/RLS, data handling, payments, dependencies, or external integrations. Use fictional data, least privilege, browser-safe public configuration, and supported tool/sandbox controls. An instruction to avoid writes is not a security boundary.

### Git, traceability, and reports

- Work on a dedicated local branch such as `chore/<scope>`, `feat/<scope>`, `fix/<scope>`, or `docs/<scope>`. Follow an existing repository convention when present. Do not discard local edits or modify global Git/SSH settings.
- Commit, push, PR creation, merge, deployment, live migration, destructive operations, and external GitHub mutations require authorization for the relevant action. Never auto-merge a protected branch or infer authorization from planning/preparation. Existing branch and protected `production` environment controls must remain in force.
- A later authorized PR describes the problem/result, linked approved requirements, relevant ADR and QA ID/revision, actual checks, risks, and rollback when relevant. A draft PR does not authorize merge or release.
- Track requirement/story ID → acceptance criteria → architecture/QA decision where applicable → implementation/PR → verification evidence. Local IDs and templates do not create remote Issues or Projects.
- Reports identify status, actual files changed, agent types actually invoked, assumptions/blockers/risks, validation with limits, approvals still required, and the next concrete action. Distinguish recommendations from implemented/verified behavior and automated checks from user acceptance.
