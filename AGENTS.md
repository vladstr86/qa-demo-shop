# QA Demo Shop — agent instructions

## Permanent language rule

Use English for agent communication, plans, reports, prompts, project documentation, test names, code identifiers, comments, and configuration descriptions. This rule applies to future work and overrides older agent configuration that requests Romanian output. Preserve the website's Romanian/English interface and localized expected strings in tests. Keep already approved QA prompts unchanged as historical approval records; write new prompts in English.

## Project

Static shop in `dist/`, JavaScript ESM. Playwright tests are in `tests/`, POMs in `pages/` and `components/`, fixtures and data in `fixtures/` and `test-data/`.

Existing commands: `npm start`, `npm test`, `npm run test:ui`, `npm run report`. Respect the user's configuration and compatible local changes.

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
- Fixed positive data: Vlad Strut; strutv@gmail.com; shipping Damrak, 70, Amsterdam, NL; billing 221B Baker St, London, UK; dummy card 4111 1111 1111 1111; 12/39; CVV 369. Separate mock login: demo@atelier.test / Demo123!.
- Negative flows copy common positive data, invalidate one relevant field, then restore valid data. Never mutate the common object.
- Check syntax and discovery; run E2E where the environment permits. Report passed/failed/not run separately. Node checks and `--list` are not passed E2E tests.
- Applying a QA prompt does not authorize commit, push, merge, deploy, global Git/SSH changes, or real payments.
