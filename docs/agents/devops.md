# DevOps role

Read [AGENTS.md](../../AGENTS.md), [README.md](../../README.md), [PROJECT.md](../../PROJECT.md), and [the QA workflow](../../qa/WORKFLOW.md) before DevOps work. This role supplements the existing instructions; it does not replace the QA approval process or authorize publication.

## Reference status

The requested sources are `/home/vlad/ProjectDemo/devops-reference/DEVOPS-AGENT.md` and `/home/vlad/ProjectDemo/devops-reference/DEVOPS-SETUP.md`. Neither file was available during the 2026-10-12 inspection. The responsibilities below come from the user's current instructions and the inspected repository. Integration of the guides and preparation of their preview/production workflows remain pending until their contents are available. Do not claim guide compliance or invent missing deployment requirements.

## Responsibilities and boundaries

- Inspect CI, public build outputs, deployment configuration, database prerequisites, and environment configuration before proposing releases.
- Prepare and validate changes locally. Distinguish local checks, browser E2E, GitHub Actions runs, remote preflight, and deployment results.
- Use GitHub **environment secrets** for workflow credentials. Report missing configuration by name only. Never print values, dump environments, enable shell tracing around credentials, or publish credential files in artifacts.
- Every production job must reference the protected `production` environment. Verify required reviewers and allowed release branches in GitHub before a production run; a YAML environment name alone does not configure protection.
- Preserve the existing suite, POMs, test limits, ignored fixtures, historical approval records, and company SSH settings. Do not modify global Git/SSH configuration.
- A website behavior, UI, or asset change still requires the QA Change Coordinator process in AGENTS.md. DevOps documentation and automation preparation alone do not trigger a website prompt.
- The current authorization covers preparation and validation only. Do not deploy, apply live migrations, delete data, commit, or push. A later action needs authorization for that action and must satisfy any existing QA approval requirements.

## Inspected project

| Area | Current state |
| --- | --- |
| CI | `.github/workflows/playwright.yml` runs on push, pull request, and manual dispatch with Node.js 24 and Chromium. Its default is the existing public deployment. Preserve it. |
| Site output | `dist/` is the static site itself, not a disposable generated directory. `build:account-sdk` rebuilds its pinned browser SDK and license files; it is not a general site build. |
| Hosting | Documentation identifies Cloudflare Pages as the public host. No deployment workflow or provider configuration was found in the checkout. The site's URL does not establish deployment credentials or release settings. |
| Account configuration | The tracked account configuration contains empty placeholders. Optional ignored configuration is browser-served when present; it may contain only browser-safe values. |
| Database upgrade | `database/migrations/001-account-orders.sql` is a review-only additive migration requiring existing order/catalog/analytics contracts. |
| Database validation | `test:database` uses disposable in-memory PGlite. `database/test-baseline.sql` is synthetic and must never be applied to a live database. |
| Live baseline | Not supplied. The isolated compatibility harness cannot establish the actual Supabase schema, grants, catalog, Auth settings, or multi-connection concurrency. |

See [account configuration and migration review](../../qa/account-orders-configuration.md) for the prerequisites and SQL review sequence.

## First read-only preflight

From the directory containing `package.json`, with Node.js 24 and the existing dependencies installed:

```bash
npm run devops:preflight
```

This local check reads tracked public site files, verifies that private configuration paths remain ignored, checks public JavaScript syntax, and lists the existing Playwright cases with fictional CI data. It does not rebuild the SDK, connect to hosting or Supabase, run checkout flows, install dependencies, or write deployment output. If dependencies are absent, install them separately with `npm ci`; installation is not part of the read-only command.

The manual **DevOps local preflight** workflow runs the same command on an isolated GitHub runner. It needs no secrets and performs no deployment. It is usable through Actions only after a separately authorized commit/push places it on the default branch; no such action has been performed.

This check is a local prerequisite, not a remote configuration audit. A successful result does not establish environment protection, secret availability, provider access, database compatibility, or readiness to deploy. Preview/production workflow preparation awaits the missing guides.

## Later remote preflight and release preparation

Once the guides are available, use their exact configuration names and workflow sequence. Inspect configuration names and protection metadata without exposing values. Record inaccessible configuration as unverified rather than absent. Keep a remote preflight read-only and separate from deployment and migration application.

Review `database/review-preflight.sql` against the intended database before any connection. Execute only separately authorized, reviewed queries in an explicitly read-only transaction with a suitably restricted database role. Avoid publishing raw function definitions or customer records. Do not run `database/test-baseline.sql` or the migration as a preflight step.

Before preparing a release artifact, select only reviewed public files. A raw copy of `dist/` can include ignored `demo.local.json` or `account-config.local.json`; Git ignore rules do not prevent uploads. Define preview configuration, production configuration, migration approval, release branch policy, rollback, and smoke checks from the supplied guides before enabling a deployment workflow.

GitHub environment protection and environment secrets are configured in repository settings, not created by naming an environment in YAML. See [GitHub's environment documentation](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) and [deployment protection documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

## Preparation validation — 2026-10-12

| Check | Passed | Failed | Not run / limitation |
| --- | ---: | ---: | --- |
| Local read-only preflight | Yes | 0 | No remote configuration audit |
| Syntax, YAML parsing, documentation links, diff whitespace | Yes | 0 | YAML parsing is not a GitHub Actions execution |
| Existing Node tests | 35 | 0 | Account client, QA handoff, and fixture loader |
| Disposable database checks | 12 | 0 | In-memory PGlite only; no live migration |
| Local desktop E2E | 10 | 0 | Existing suite, RO/EN inside cases |
| Local mobile E2E | 8 | 0 | Existing suite; desktop-only cases excluded |
| GitHub Actions / remote preflight / releases | 0 | 0 | Not run |

The browser suite ran at `http://127.0.0.1:4189/` with local private test-data loading disabled; 18 instances passed in 1.2 minutes. File fingerprints verified preservation of the existing CI, site, tests, fixtures, database files, QA records, and lockfile. Original AGENTS.md instructions remain verbatim, with only the DevOps section added. No Git/SSH configuration was changed.

Unavailable inputs: `DEVOPS-AGENT.md`, `DEVOPS-SETUP.md`, and the actual database baseline. Empty tracked account fields: `url`, `publishableKey`. GitHub environment secret names and protection settings were not inspected remotely and remain unverified, not confirmed missing. No secret values were printed. No deployment, live migration, deletion, commit, or push occurred.
