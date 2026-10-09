# QA Change Coordinator

The coordinator reviews a website change and drafts instructions for updating the local implementation and tests. The user approves the exact version before dispatch or application. All new project work and prompts use English; the website remains bilingual Romanian/English.

## Workflow

1. Complete the authorized website change.
2. Ask `qa_coordinator` for read-only analysis of the differences and a prompt.
3. Save the prompt in `qa/prompts/` with a unique ID/revision and run `npm run qa:prepare -- <prompt> <id> <revision>`.
4. `qa/latest.json` binds the prompt to actual `dist/` content with SHA-256. ZIP files are excluded to prevent recursive generation. Preparation does not dispatch or apply tests.
5. The user reviews the prompt with `npm run qa:review` and approves its exact ID/revision.
6. After approval, implement within the reviewed scope, run available checks, and report actual results. The user reviews the result.

Run `npm run qa:review` before editing even when approval was given directly in this conversation or in VS Code. If source or prompt fingerprints fail, stop application and prepare a new revision. Changes to requirements or website source need a fresh prompt and approval. Documentation, test changes, and ZIP regeneration do not trigger a new prompt.

## Manual application

Open the project in VS Code and start Codex with the project instructions loaded. Example authorization: “I approve QA-001 r1. Run npm run qa:review, confirm its ID/revision and fingerprints, then apply qa/prompts/QA-001-EUR.md.”

Conversation approval authorizes the current agent to apply that exact prompt after validation. It does not require launching a second Codex CLI process. Record the actual implementation and verification in a separate review report; preserve the approved prompt text. The manifest's original `pending` status describes the prepared CLI handoff and does not record manual conversation approval.

There is no confirmed channel that inserts text into the VS Code extension. Do not claim dispatch to VS Code or another service without evidence.

## Optional local CLI dispatch

```bash
npm run qa:review
npm run qa:apply
```

`qa:apply` displays the prompt and asks for the exact token, such as `APROB QA-001 r1`, in an interactive terminal. This existing token is a compatibility contract, even though project instructions are English. The command requires an installed, authenticated Codex CLI; it does not install the CLI or change authentication.

After approval, the helper validates the fingerprints again and sends the prompt on stdin to `codex exec --sandbox workspace-write -`. Changed source, text, or manifest blocks dispatch. Follow local permissions and report blocked operations without disabling protections.

A `dispatched` status and exit code describe the CLI process. They do not prove that E2E tests passed. Read the implementation report and Playwright results.

## Installing into an existing local project

Extract a reference archive into a separate directory. Preserve the local suite and compatible changes. Transfer `qa/`, `scripts/qa-handoff.mjs`, `scripts/qa-handoff.test.mjs`, and the local coordinator configuration; merge the project instructions and only the required `qa:*` npm scripts.

A received manifest refers to the archive's website. If local `dist/` differs, the coordinator must analyze the local version and prepare its corresponding prompt. Never replace a fingerprint merely to bypass review.

## Automation limits

These instructions trigger coordinator work when an agent completes a website change. They do not create a background watcher for manual or external edits. No external GitHub/Sites event trigger or direct VS Code dispatch integration is configured here.

The approved QA-001 r1 prompt remains in its original Romanian as an immutable approval record. Future prompts and reports use English.
