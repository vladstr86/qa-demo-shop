# Migration planning status

Status: preparation only. No 2.0 architecture or refactoring is approved. No live migration is authorized.

The configured Software Architect must inspect actual source, database contracts, test/build dependencies, and the current [project scope](../PROJECT.md) before proposing an incremental migration. Its initial read-only validation findings are recorded in the [configuration report](../docs/workflows/agent-foundation-validation.md).

Before a concrete plan can be approved:

1. Product Manager defines a bounded goal, acceptance criteria, exclusions and dependencies; obtain user approval of that scope.
2. Architect maps current code and external contracts, compares alternatives, and drafts relevant ADRs. Identify absent components and unverified assumptions explicitly.
3. Review Security, DevOps and QA impacts, compatibility with existing behavior, and dependencies on missing reference guides or actual database evidence.
4. Propose small reversible steps, owned files, contract/test updates, data treatment, verification and rollback. Separate local code preparation from any live operation.
5. Obtain approval of concrete implementation scope and follow existing QA prompt/fingerprint gates. Require separate authorization and enforced protections for any later production operation.

The existing top-level `database/migrations/` files keep their current review-only status. This document does not authorize applying them or replacing their prerequisites.
