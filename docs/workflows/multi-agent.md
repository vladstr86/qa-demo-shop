# Multi-agent workflow

The main Codex agent is the AI Orchestrator. Project-scoped specialists are `product_manager`, `software_architect`, and the preserved `qa_coordinator`. DevOps remains governed by [its existing instructions](../agents/devops.md). [AGENTS.md](../../AGENTS.md) and [the QA workflow](../../qa/WORKFLOW.md) remain authoritative.

## Routing and handoff

| Incoming work | Consult | Deliverable before implementation |
| --- | --- | --- |
| Business request, product flow, backlog or release | Product Manager; UI/UX responsibility when relevant | Bounded story, acceptance criteria, priority/dependencies, unresolved questions |
| Domain boundary, API/schema/auth change, framework or migration | Software Architect; Security and DevOps responsibilities as needed | Inspected facts, alternatives, proposed ADR, security/QA impact and incremental plan |
| Approved implementation | Assigned developer with explicit file ownership | Scoped diff and meaningful verification; independent review for substantive changes |
| Website behavior/UI/assets changed | Existing QA Change Coordinator | Versioned prompt prepared by Orchestrator; exact user approval before application |
| CI, public build output, release preparation | Existing DevOps instructions | Local evidence and named prerequisites; publication/migration separately authorized |
| Documentation/configuration only | Orchestrator; relevant specialist if useful | Scoped documentation/configuration diff and validation; no recursive QA prompt |

Select the smallest useful group. A handoff includes objective, approved scope, owned files or read-only boundary, inspected inputs, dependencies, output, checks, and approval limits. Workers share files; tell them they are not alone and must preserve others' changes. Keep one active owner per edited file. Ask specialists through the Orchestrator instead of spawning nested agents. Cap concurrency at three subagents across the task.

PM owns requirement clarity; Architect owns technical recommendations; developer owns authorized implementation; QA owns verification recommendations/execution as assigned; user owns acceptance and explicit approval. The Orchestrator resolves dependencies and integrates results. A role's recommendation cannot substitute for user approval.

## Configuration and permissions

The installed validation target is `codex-cli 0.162.0-alpha.17.2`. The project uses standalone `.codex/agents/*.toml` files with `name`, `description`, and `developer_instructions`. `.codex/config.toml` enables agents and sets `agents.max_concurrent_threads_per_session = 3`; the primary thread is excluded. Models and reasoning inherit existing user/session choices.

New local parent sessions default to `workspace-write`, `on-request` approval, and sandboxed shell networking disabled. Higher-priority client settings, command-line flags and managed policy can override project defaults. Project configuration is loaded only in a trusted project; do not silently change global trust or user configuration to activate it. Configuration edits do not guarantee hot reload of this chat's available agent types.

PM and Architect disable supported app, plugin, and permission-request capabilities. They retain shell reads to inspect local source and are instructed to return drafts without writing. Custom agents inherit parent sandbox/approval and MCP settings. Those instructions and feature reductions do **not** guarantee a read-only filesystem or block every inherited external tool. The preserved coordinator's existing `sandbox_mode = "read-only"` field also cannot override the parent session in this Codex version. Its instruction and approval workflow are preserved verbatim.

For enforced filesystem restrictions during advisory delegation, start a **parent** session in read-only mode:

```bash
codex --sandbox read-only --ask-for-approval never
```

Then request the specialist by its exact name. Configure/restrict external tools on the parent or service permission layer; shell sandboxing does not restrict hosted apps/MCP. No production credentials, branch protection, GitHub permissions, or environment protection are configured by this task. The existing [DevOps constraints](../agents/devops.md) still apply.

## Read-only smoke tasks

Use these in a fresh session after configuration loads. Do not write files, run migrations, contact live account services, create tickets/projects, or make any remote mutations. Ask the main agent to wait for and report the actual delegate results.

```text
Delegate a read-only task to product_manager. Read AGENTS.md, PROJECT.md and docs/product/.
Return one draft story template using GIVEN/WHEN/THEN, traceability fields and three
GitHub Projects preparation questions. Label it proposed; create nothing remotely.
Report inspected files and return the actual delegate result.
```

```text
Delegate a read-only task to software_architect. Inspect PROJECT.md, package.json,
dist/index.html, dist/app.js, dist/account-*.mjs, database/ and scripts/validate-account-database.mjs.
Return current boundaries, three evidence-based risks and prerequisites for an incremental
2.0 proposal. Do not refactor, write files, apply SQL or claim the proposed architecture exists.
Report inspected files and return the actual delegate result.
```

If a client cannot discover a configured type, report the failed attempt. Do not silently label a generic agent as the configured specialist. Use a supported fresh local CLI session for validation when available and report its result separately. No external VS Code dispatch integration is assumed.

## Approval, review, and traceability

Keep product scope and architecture decisions proposed until user approval. For future significant changes, present a concrete story/decision and affected scope; proceed within an existing exact authorization. For website changes use the existing coordinator → prompt → `qa:prepare` → exact ID/revision approval → `qa:review` → implementation/verification sequence. Do not edit historical prompts or regenerate fingerprints to avoid a gate. This configuration task does not prepare or apply a new QA prompt.

Before implementation, obtain architecture input on cross-domain/API/schema/auth/runtime changes and security input where data/access/payment/dependency boundaries change. Before delivery, review the diff, preserve compatible local work, resolve material findings, and run checks appropriate to scope. Keep the 10 desktop / 8 mobile discovery limits and distinguish E2E from syntax or discovery checks.

Use the [product templates](../product/README.md) and [architecture workspace](../../architecture/README.md). Carry local story ID, acceptance criteria, proposed/approved status, relevant ADR, QA prompt ID/revision, implementation/PR reference, and verification evidence through handoffs. Missing values are explicitly pending, never fabricated. Record approvals in a separate report/reference without rewriting approved QA prompt text.

Work on a dedicated local branch. Commit, push, PR creation, external GitHub changes, merge, deployment, live migration and data deletion need their own authorization. Protected branch and environment settings require actual service enforcement; prose and YAML names do not establish it.

Reports state files changed, actual delegates, results as passed/failed/not run, limitations, outstanding decisions/approvals, and the next bounded action. See [the configuration validation report](agent-foundation-validation.md) for this task's evidence.

## Official configuration references

Configuration choices were checked against current [OpenAI subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) and [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) on 2026-10-26, then checked against the installed CLI. Revalidate on client upgrades; avoid assuming older per-agent sandbox examples enforce isolation.
