# Architecture workspace

This workspace is for inspected facts and proposed decisions for QA Demo Shop 2.0. The existing implementation remains the static bilingual shop described in [PROJECT.md](../PROJECT.md). Creating these directories does not approve a backend, Admin application, framework, or migration.

- `adr/`: proposed Architecture Decision Records, reviewed alternatives and approval evidence.
- `diagrams/`: C4 diagrams that clearly label current and proposed boundaries.
- `api/`: reviewed current contracts and proposed REST/OpenAPI contracts.
- `database/`: evidence-based data models and schema reviews; existing executable SQL stays in the top-level `database/` directory.
- [migration-plan.md](migration-plan.md): prerequisites and planning status before any implementation.

The Software Architect must inspect the affected code before drafting designs. It returns drafts to the Orchestrator for authorized persistence. Each future ADR records ID, proposed/approved status, context/evidence, requirement links, alternatives, decision, consequences, security/QA impact, verification, rollback, and approval reference. No ADR is approved by creating a file.
