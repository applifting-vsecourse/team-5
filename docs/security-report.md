# Dependency security report

Date: 2026-11-05. Scope: #165, workspace npm dependencies (including development tools), Node.js, Docker base images and GitHub Actions. Baseline: `dev` at `c8bd6da`.

## Findings and remediation

Counts below come from `pnpm audit --json`; they count findings across the dependency graph, not unique CVEs. Results depend on the registry advisory database at the time of the run.

| Audit                            | Low | Moderate | High | Critical |
| -------------------------------- | --: | -------: | ---: | -------: |
| Baseline, all dependencies       |  14 |       65 |   56 |       10 |
| Updated, all dependencies        |   1 |        4 |    0 |        0 |
| Updated, production dependencies |   0 |        2 |    0 |        0 |

Updated direct dependencies within their existing major versions, including Better Auth 1.7.1 → 1.7.17, Prisma 7.9.1 → 7.10.1, NestJS 11.2.1 → 11.2.8, Multer 2.4.0 → 2.5.0, Vite 8.2.1 → 8.3.6, Vitest 4.1.11 → 4.1.12, React 19.2.8 → 19.3.1 and Zod 4.4.3 → 4.6.7. Nodemailer required a major update, 9.0.5 → 10.3.1, to address the remaining mail-related advisories. The lockfile also refreshes transitive dependencies such as `qs`, `fast-uri`, `js-yaml`, `undici`, `brace-expansion`, `proxy-addr`, `shell-quote` and `handlebars`.

`pnpm-workspace.yaml` contains four bounded overrides for versions retained by upstream dependencies: Next.js <15.5.29, Sharp <0.35.5, PostCSS <8.5.23 and Multer <2.5.0. Next.js is a transitive peer dependency of Better Auth; TrainLoop itself uses Vite. Keep these overrides until upstream resolution no longer retains vulnerable versions. No advisory is hidden or allowlisted.

New lint rules required optional chaining in the client list and an explicit JSON response type in the API client. The router now types errors as `unknown`; the existing error boundary narrows them before displaying a message.

## Runtime and container images

Node.js is pinned to 24.22.2 in `.nvmrc` and all Dockerfiles, and manifests require at least 24.22.2. CI reads `.nvmrc`; pnpm is updated to 10.34.9. Node 24.22.2 includes the [24.22.1 security fixes](https://nodejs.org/en/blog/release/v24.22.1), including the Brotli issue CVE-2026-111497 referenced by the ticket. Brotli is bundled into Node, so a clean npm audit alone would not verify that fix.

Images were checked against Docker Hub and updated to `node:24.22.2-alpine`, `nginx:1.30.6-alpine`, `postgres:17.11-alpine` and `axllent/mailpit:v1.33.0`. PostgreSQL remains on major 17, preserving the existing data-directory layout. The nginx release includes the fixes listed in the [official release announcements](https://nginx.org/). Builds use `--pull` during verification. Image tags are versioned but mutable; this report does not claim that all Alpine system packages are free of CVEs. An OS-level image vulnerability scan is outside the npm audit results above.

GitHub Actions were checked against their upstream releases: checkout 7.0.1, setup-node 7.1.0, pnpm/action-setup 6.1.1, docker/login-action 4.8.0 and docker/build-push-action 7.4.0.

## Remaining findings

Rechecked on 2026-11-07 after merging `dev`: **4 moderate findings across 2 unique advisories**, plus **1 low finding**. The all-dependency audit counts each affected installed version: `glob` 10.5.0 and 13.0.6 contribute two moderate findings; `minimatch` 9.0.9 and 10.2.6 contribute two more. The production-only audit reports two moderate findings (`glob` 13.0.6 and `minimatch` 10.2.6 through `react-email`). Thus the three advisory rows below account for all five findings; no advisory is omitted. Both audits report zero high and zero critical findings.

| Advisory                                                                           | Dependency paths and exposure                                                                                                                                                                            | Reason retained / follow-up                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), low      | Nest CLI → fork-ts-checker-webpack-plugin → deepmerge 4.3.1; development only. Prototype poisoning requires crafted merge input.                                                                         | No patched version is published. Build configuration is repository-controlled; do not pass untrusted objects into this tooling. Revisit when an upstream fix is released.                                                                                                                                                                                    |
| [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), moderate | Nest CLI/Jest tooling and react-email → glob 10.5.0 / 13.0.6. Traversal can continue after AbortSignal cancellation. `react-email` is a production dependency because templates and rendering import it. | The fix requires glob 14.0.2, beyond upstream major constraints. A global forced major upgrade could break build/email tooling. Current template locations are repository-controlled, with no API accepting glob patterns or directory trees. Upgrade upstream packages or separately split the email CLI from runtime rendering, then remove this exposure. |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), moderate | The same tooling → glob → minimatch 9.0.9 / 10.2.6. Crafted patterns can amplify CPU/memory use with optimization level ≥2. Also present through react-email in the production tree.                     | The fix requires minimatch 11.0.1, beyond upstream major constraints. No user-controlled glob patterns are accepted by TrainLoop. Reassess with the glob/upstream upgrade rather than replacing this API across consumers without dedicated compatibility work.                                                                                              |

The exposure assessment is based on current imports and use of these tools, not a penetration test. Residual findings remain visible in normal audit output; high and critical findings are never exempted.

## Continuous monitoring

- Repository Dependabot alerts were already enabled. Automated security updates were enabled and verified through the GitHub API (`enabled: true`, `paused: false`).
- `.github/dependabot.yml` configures weekly updates against `dev` for workspace npm dependencies, GitHub Actions, Dockerfiles and Compose images. npm minor/patch updates and security updates are grouped separately. PostgreSQL major upgrades require a separate migration and are excluded from automatic version proposals.
- `pnpm security:audit` runs `pnpm audit --audit-level=high` over runtime **and** development dependencies. It is part of `pnpm check-all`, the required `verify` CI job, and a prerequisite job for deployment (including manual deployment). High/critical findings or registry failures stop the gate.
- CI additionally runs every Monday at 07:00 UTC, so new advisories are checked without requiring a code change. Dependabot configuration takes effect when this PR reaches the default branch, currently `dev`. Proposals still require normal review and CI.

See [pnpm audit options](https://pnpm.io/10.x/cli/audit), [Dependabot configuration](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) and [security update setup](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).

## Reproduce

Use Node from `.nvmrc` and pnpm from `packageManager`:

```shell
pnpm install --frozen-lockfile
pnpm audit --json
pnpm audit --prod --json
pnpm security:audit
pnpm check-all
docker build --pull -f apps/backend/Dockerfile.deploy -t trainloop-security-backend .
docker build --pull -f apps/frontend/Dockerfile.deploy -t trainloop-security-frontend .
```

The full audit intentionally exits nonzero for the documented low/moderate findings; the high/critical gate exits zero. To demonstrate a failing gate without changing the application, run `pnpm audit --audit-level=high` in a separate checkout of baseline `c8bd6da`: the baseline high/critical findings produce a nonzero exit.

Validation results are recorded in the pull request and its CI run.
