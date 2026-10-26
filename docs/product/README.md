# QA Demo Shop 2.0 product work

This directory prepares local product planning for QA Demo Shop 2.0. The inspected [project brief](../../PROJECT.md) is the current scope baseline. “2.0” names this planning effort; it does not approve new features, a release, or a package version change. No new epic or story is approved by these templates.

Follow [AGENTS.md](../../AGENTS.md), the [QA workflow](../../qa/WORKFLOW.md), and the [DevOps boundaries](../agents/devops.md). Existing user approvals and historical QA prompts retain their exact scope and revision.

## Ownership and planning

- The PM records the requested outcome, scope, priorities, dependencies, acceptance criteria, and user decisions. The user approves scope and acceptance; a planning status is not approval.
- The Orchestrator assigns named owners, coordinates handoffs, and reports evidence and blockers within the authorized scope.
- UI/UX reviews affected interactions, content, accessibility, responsive behavior, and RO/EN presentation. The Architect reviews technical boundaries, data contracts, dependencies, compatibility, and relevant decisions.
- Developers implement authorized work. QA inspects existing coverage and verifies observable criteria. The read-only QA Change Coordinator retains its separate versioned prompt and approval process.

Use local IDs `QDS2-E###` for future epics and `QDS2-S###` for future stories. Allocate the next unused number when a real request is recorded; do not reuse IDs. A story references one epic or explains why it stands alone. Local IDs are distinct from GitHub issue numbers and QA prompt IDs.

Record candidate priority as `P0` (blocks an agreed critical outcome), `P1` (required for an agreed milestone), `P2` (useful improvement), or `P3` (deferred). Priority, target release, estimates, and dates remain proposals until the relevant user decision is recorded. “QA Demo Shop 2.0” is not a promised release date.

## Local workflow

1. Capture a concrete request and its source. Compare it with PROJECT.md and inspect the affected implementation and existing suite before proposing scope.
2. Draft an epic only when multiple related stories need a shared outcome. Split stories by observable behavior, with explicit exclusions and dependencies by local ID.
3. Write independent acceptance criteria as GIVEN / WHEN / THEN scenarios. Include relevant positive, negative, bilingual, responsive, accessibility, and data-integrity behavior. Identify missing decisions instead of inventing expected behavior.
4. Send affected design questions to UI/UX and technical questions to the Architect. Record the decision, author, date, source, and unresolved dependencies. Specialist review does not approve implementation.
5. Present scope and proposed release grouping for user review. Record the exact approved artifact/revision and scope. Track unresolved dependencies and release prerequisites; a target release does not authorize deployment.
6. Implement only authorized work. Preserve the coordinator trigger after an authorized website change. Applying a resulting QA prompt requires exact ID/revision approval and `npm run qa:review` before editing under that prompt.
7. Link implementation and verification evidence to each criterion. Report checks as passed, failed, or not run, and identify environment limits. Obtain user acceptance separately from test results.

A story is ready for implementation when its outcome, exclusions, observable criteria, owner, dependencies, relevant handoffs, and required user authorization are recorded. It is complete when the approved scope is implemented, criterion evidence is recorded, required QA approvals are satisfied, unresolved limits are disclosed, and user acceptance is recorded. Release/deployment authorization remains separate.

## Traceability

Keep this chain in each future ticket: request source → epic/story ID and revision → numbered acceptance criterion → design/architecture decision → authorized implementation → test/check evidence → user acceptance. Link a QA prompt using its exact `QA-ID rN` and review report. Link commits or pull requests only when they exist following separate authorization; do not invent them.

The suite remains JavaScript ESM with POM interactions and test assertions, CSS locators, independent integer-cent EUR checks, RO/EN within cases, and at most 10 desktop / 8 mobile / 18 discovered instances. Use fictional tracked test data and preserve private fixtures. Existing coverage should be regrouped where useful before adding cases.

## Future ticket template

Copy this template for an actual requested epic or story. All placeholders must be resolved or explicitly marked pending; the template is not a populated backlog.

```markdown
# <QDS2-E### or QDS2-S###>: <requested outcome>

Revision: <number>
Type: <Epic | Story>
Status: <local planning status>
Request source: <conversation/document reference>
Epic: <local epic ID | standalone with reason>
Owner: <assigned person/role | pending>
Priority: <proposed P0–P3 and reason>
Target release: <proposal | unassigned>
Dependencies / blocked by: <local IDs and concrete prerequisites | none>

## Outcome and scope
<Who needs what observable outcome, and why?>
Included: <bounded behavior>
Excluded: <explicit boundaries>
Current behavior/source: <verified files or evidence>

## Acceptance criteria
AC-1: GIVEN <observable initial state>
      WHEN <one relevant action or event>
      THEN <verifiable result>
AC-2: GIVEN <valid shared setup with one relevant invalid condition>
      WHEN <action>
      THEN <error/result and preserved state>
RO/EN, responsive, accessibility, and privacy considerations: <relevant criteria or rationale>

## Handoffs and decisions
UI/UX: <questions, affected states, decision/evidence | not required with reason>
Architect: <contracts, constraints, compatibility decision/evidence | not required with reason>
QA: <existing coverage, proposed grouping, data/fixture needs, verification plan>
Open questions: <decision owner and effect on readiness | none>

## Authorization and evidence
Scope approval: <exact artifact/revision, user decision, date | pending>
QA prompt: <exact QA-ID rN and prompt link | not triggered/pending>
Implementation: <authorized files and actual evidence | pending>
Criterion evidence: <AC-ID → test/check/manual result and artifact>
Checks: <passed / failed / not run, with limits>
User acceptance: <decision/source/date | pending>
Release authorization: <separate decision | not requested>
```

Use the [GitHub Projects preparation plan](github-projects-plan.md) only when preparing a future remote board. Local planning does not create or update GitHub artifacts.
