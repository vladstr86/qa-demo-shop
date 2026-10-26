# GitHub Projects preparation plan

Everything in this document is a **proposal**. No GitHub Project, issue, field, view, automation, permission, or release has been created or changed by this plan. Remote creation and issue edits are disabled unless the user explicitly authorizes the specific operation and scope. These proposals do not establish an approved backlog.

The local [product workflow and ticket template](README.md) remain usable without GitHub. Existing repository instructions, exact QA prompt approvals, and release authorization boundaries continue to apply.

## Read-only capability check before remote preparation

1. Discover the connected GitHub tool capabilities and confirm the intended repository and project owner. Inspect only the metadata needed for the authorized task; do not expose credential values.
2. Check separately whether the connector supports GitHub Projects, the intended project type, project metadata, fields, views, and permissions. Repository/issue support alone does not establish Projects support or write access.
3. If an existing target project is identified, inspect accessible current settings before proposing changes. Record inaccessible capabilities or permissions as unverified, not absent.
4. If Projects operations are unavailable, record the capability gap and retain this local proposal. Do not fall back to CLI, GraphQL, REST, browser, or other remote mutation to bypass that gap or an authorization boundary.
5. Before any future remote mutation, present a concrete change list naming the target owner/repository/project, affected issues, field values, and proposed automation. Apply only explicitly authorized operations through supported capabilities. A scope approval, prepared template, or permission check does not authorize remote creation or issue edits.

This plan does not request or perform a remote capability check now.

## Proposed fields

All fields and option values below are proposals, subject to existing project capabilities and settings.

| Proposed field | Proposed type / values | Purpose |
| --- | --- | --- |
| Local ID | Text; `QDS2-E###` / `QDS2-S###` | Preserve stable local traceability across tools |
| Work type | Single select; Epic, Story | Group requested outcomes and bounded work |
| Status | Single select; Intake, Refinement, Ready, In progress, Review, Done | Represent the proposed workflow below |
| Priority | Single select; P0, P1, P2, P3 | Record the PM's proposed ordering with a reason in the ticket |
| Owner | Existing assignee field where supported | Name the accountable implementation owner |
| Epic | Supported parent relationship, otherwise a reference in the ticket | Trace a story to its shared outcome |
| Target release | Text or existing milestone | Group proposed release scope without authorizing publication |
| Dependencies | Supported issue relationship, otherwise local IDs in the ticket | Identify prerequisites and blocking relationships |
| Blocked | Single select; No, Yes | Preserve workflow position while exposing a blocker and owner |
| Scope approval | Single select; Pending, Approved, Changes requested | Point to the exact user decision in the ticket; a field alone is not evidence |
| QA prompt | Text; exact `QA-ID rN` or pending/not triggered | Link the governed QA handoff separately from story status |

Use existing fields where appropriate; avoid duplicating current project settings. Acceptance criteria, decision records, evidence, and approval links belong in the issue body using the local ticket template. Never copy private fixtures, credentials, customer data, or ignored historical private prompts into an issue.

## Proposed statuses and transitions

| Proposed status | Proposed entry condition | Proposed next handoff |
| --- | --- | --- |
| Intake | A real request and source have been recorded | PM verifies scope against the existing project |
| Refinement | Outcome is being clarified; criteria, dependencies, or decisions remain open | Relevant UI/UX, Architect, and QA review |
| Ready | The local readiness conditions and required user authorization are recorded | Orchestrator assigns authorized work |
| In progress | An owner is executing the authorized scope | Implementation and appropriate checks |
| Review | Implementation and criterion evidence are available; required QA approval is satisfied for any applied prompt | User reviews evidence and accepts or requests changes |
| Done | The local completion conditions and user acceptance are recorded | Separate release preparation if authorized |

Mark blocked work with the proposed Blocked field and a concrete reason, dependency, and decision owner. Do not equate Done, an issue closure, or a merged pull request with deployment approval.

## Proposed views and automation mappings

| Proposed view | Proposed configuration | Intended use |
| --- | --- | --- |
| Delivery Kanban | Board grouped by Status; visible Priority, Owner, Blocked, Target release | Coordinate authorized work and reviews |
| Refinement | Table filtered to Intake / Refinement | Resolve criteria, dependencies, and missing decisions |
| Release planning | Table grouped by Target release and sorted by Priority | Review proposed scope and prerequisites |
| Blocked work | Table filtered to Blocked = Yes | Track the next dependency or decision |
| Epic traceability | Table grouped by Epic with Local ID and QA prompt | Review outcome-to-story-to-QA links |

All automation mappings are proposals and remain disabled until separately approved and verified as supported:

- Item added → Intake, only for explicitly authorized additions; no automatic repository-wide issue import.
- Implementation starts → In progress through an owner update after readiness/authorization is checked; do not infer approval from assignment.
- Pull request opens → suggest Review only when authorized implementation, criteria, and verification evidence are complete; no automatic approval.
- Pull request merges or issue closes → no automatic Done. Record user acceptance and QA evidence before a deliberate status update.
- Ready/Done transitions → no dispatch, commit, push, deployment, migration, payment, or automatic QA approval.

## Future authorized rollout record

Before proposing a rollout, fill in the intended target, accessible existing settings, connector/Projects capability results, exact requested changes, issue payloads derived from actual user requests, and limits. Record the authorization source for each mutation. After an authorized supported operation, report actual results and verified artifact links; distinguish prepared, attempted, completed, failed, and not run. Never describe this local plan as an active GitHub board or synchronization integration.
