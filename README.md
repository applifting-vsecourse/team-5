# TrainLoop

Aplikace pro trenéry psů a jejich psovody vyvíjená týmem 5 v rámci kurzu [4IT580](https://4it580.vse.cz) na VŠE. TrainLoop usnadňuje plánování tréninkových cílů, vedení tréninků v terénu, zaznamenávání zpětné vazby z proběhlých cvičení a sdílení pokroku mezi trenérem a majitelem psa.

**Stack:** React + Vite + TanStack Router/Query + Tailwind CSS + shadcn/ui (frontend) · NestJS + Prisma + PostgreSQL + BetterAuth (backend) · pnpm workspaces.

Staging prostředí: [team-5.vsepractical.applifting.dev](https://team-5.vsepractical.applifting.dev)

## Projektová dokumentace a výstupy discovery

Kompletní dokumentace a výstupy z discovery fáze se nachází v adresáři [`docs/vystupy/`](docs/vystupy/README.md):

- **Lean Canvas & Finanční model:** [`docs/vystupy/lean-canvas.md`](docs/vystupy/lean-canvas.md), [`nakladova-struktura.xlsx`](docs/vystupy/nakladova-struktura.xlsx)
- **Kvalitativní rozhovory s trenéry:** [`docs/vystupy/rozhovor/vysledky.md`](docs/vystupy/rozhovor/vysledky.md)
- **Sitemapa a architektura:** [`docs/vystupy/sitemapa.md`](docs/vystupy/sitemapa.md) ([SVG diagram](docs/vystupy/sitemapa.svg))
- **Feature breakdown a backlog:** [`docs/vystupy/feature-breakdown.xlsx`](docs/vystupy/feature-breakdown.xlsx)
- **Figma Wireframy a Design:** [Wireframy (01–21)](https://www.figma.com/design/IjEnmXXeJB8YBOWPjWiFu3/Trainloop-wireframe?node-id=0-1) · [Design systém & obrazovky](https://www.figma.com/design/LBlhF1wiyl639ENDDG2RWE/Trainloop)
- **Pravidla a konvence:** Pravidla pro UI v [`DESIGN.md`](DESIGN.md), technické konvence a workflow v [`CLAUDE.md`](CLAUDE.md).

## Klíčové funkce

- **Týdenní kalendář tréninků:** Přehled naplánovaných cvičení na daný týden, možnost přesunu na jiný den či přeskočení tréninku.
- **Průchod tréninkem v terénu:** Krok za krokem vedený trénink s cviky, kritérii úspěchu a časovačem.
- **Záznam tréninku („Jak to šlo?“):** Zhodnocení tréninku psovodem (posuvník úspěšnosti po 10 %, soustředění, chyby, poznámka).
- **Správa psů a tréninkových cílů:** Tvorba cílů s rozpadem na konkrétní cviky a drag-and-drop řazením.
- **Propojení trenéra a klienta:** Generování pozvánek s unikátním kódem pro sdílení profilu psa a tréninkového plánu.

## Prerequisites

- Node.js 24 — the version in [`.nvmrc`](.nvmrc). With nvm or fnm, `nvm use` picks it up from anywhere in the repo (they search parent directories), and every `package.json` declares it too, so pnpm warns if you are on an older one.
- pnpm — `corepack enable` picks the version from `package.json`
- Docker (for the database)

## Quick start

```shell
pnpm install
pnpm dev
```

`pnpm dev` does everything: creates `.env` files from examples, starts Postgres in Docker, applies migrations, seeds demo data, and runs both dev servers.

| What               | Where                                                |
| ------------------ | ---------------------------------------------------- |
| Frontend           | http://localhost:3050                                |
| API                | http://localhost:4050/api                            |
| API docs (Swagger) | http://localhost:4050/api/docs                       |
| Auth API docs      | http://localhost:4050/api/auth/reference             |
| DB browser         | `pnpm backend prisma:studio` → http://localhost:5555 |

The ports are deliberately odd — 3050, 4050, and Postgres on 5433 rather than the usual 3000, 4000 and 5432 — so the stack doesn't fight whatever else you have running. They're pinned rather than auto-incremented: the API only accepts requests from the frontend's exact origin, so a port that silently moved would surface as an unexplained CORS error.

### Seeded users

| Email                      | Password        | Role / Note                             |
| -------------------------- | --------------- | --------------------------------------- |
| `trener@trainloop.cz`      | `password1`     | Trenér (Marek Trenér, vlastní pes Argo) |
| `jan.novak@seznam.cz`      | `password1`     | Klient (Jan Novák, psi Rex & Baryk)     |
| `petra.svobodova@email.cz` | `password1`     | Klientka (Petra Svobodová, pes Alík)    |
| `tomas.dvorak@gmail.com`   | `password1`     | Klient (Tomáš Dvořák, pes Lucky)        |
| `eva.novotna@email.cz`     | `password2`     | Psovod (Eva Novotná)                    |
| `admin@example.com`        | `adminpassword` | Administrátor                           |

Verification/reset emails are printed to the backend terminal (console mailer) unless you configure Resend or SMTP in `apps/backend/.env`.

## Everyday commands

```shell
pnpm check-all                     # lint + type-check + tests + builds (what CI runs)
pnpm backend test                  # backend unit tests (jest)
pnpm frontend test:ci              # frontend component tests (vitest)
pnpm backend prisma:migrations:run # create + apply a migration after schema changes
pnpm backend prisma:studio         # browse/edit the database
pnpm backend seed                  # re-seed the database
pnpm dev:down                      # stop the database container
```

## Branches and staging

| Branch        | What it is                                          | How changes get in                              |
| ------------- | --------------------------------------------------- | ----------------------------------------------- |
| `feature/...` | One user story, cut from `dev`                      | Commits                                         |
| `dev`         | Integration branch, default target for PRs          | PR from a feature branch, green CI + 1 approval |
| `main`        | Staging: https://team-5.vsepractical.applifting.dev | Release PR from `dev`, green CI + 1 approval    |

Every merge to `main` builds and deploys through [`deploy.yml`](.github/workflows/deploy.yml) (Coolify). Details in [`CLAUDE.md`](CLAUDE.md#branches-and-pull-requests).

## Deployment

The whole app ships as one Docker Compose stack — Postgres, the backend, and the frontend (built to static files, served by nginx). See [`docker-compose.yml`](docker-compose.yml).

```shell
cp .env.example .env     # then edit: secrets, and the public URLs
docker compose up --build
```

On **Coolify** (Hetzner): create a Docker Compose resource pointing at this repo, set the variables from `.env.example` in the resource's environment, and assign domains to the `frontend` and `backend` services. Coolify's proxy handles TLS, so the published host ports only matter for local runs.

Two things worth knowing:

- **You set exactly two URLs**, `BACKEND_URL` and `FRONTEND_URL`. The backend uses them for CORS, BetterAuth trusted origins and password-reset links; the frontend's API URL is derived from `BACKEND_URL`. Point them at the real domains or the backend rejects the browser.
- **The frontend bakes its API URL in at build time** (`VITE_*` are build args, not runtime env), so changing `BACKEND_URL` needs a rebuild, not just a restart.
- **Production migrates and seeds on startup** — the container runs `prisma migrate deploy` and `node dist/scripts/seed/seed.script.js` before starting the server. If the database is empty, it populates demo users and dogs; if data already exists, it preserves existing data.

## When something goes wrong

| Symptom                                                  | Cause / fix                                                                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev` fails immediately, Docker errors              | Docker Desktop isn't running. Start it and retry.                                                                                                                                    |
| `Port 3050 is already in use`                            | Another app has it. Stop it — the port is pinned on purpose, because the API only accepts requests from `http://localhost:3050`.                                                     |
| Page loads but login fails, console shows a CORS error   | The frontend is on a different port than the API expects. See above.                                                                                                                 |
| `EADDRINUSE :::4050`                                     | An old backend is still running: `lsof -i :4050` then kill the process.                                                                                                              |
| Prisma: "column does not exist" after editing the schema | You changed `schema.prisma` without migrating: `pnpm backend prisma:migrations:run`.                                                                                                 |
| Want the demo data back / a clean database               | `pnpm backend db:reset` — it replays the migrations and re-runs the seed. (Plain `pnpm backend seed` does **not** wipe an existing database; it skips when users are already there.) |
| A commit is blocked by lint or formatting                | The pre-commit hook auto-fixes what it can; fix the rest, or `git commit --no-verify` to bypass it once.                                                                             |
| Browser shows a red error overlay while typing           | That's the type/lint checker, not a crash. Read the message — the app is still running.                                                                                              |

## Layout

```
apps/backend/   NestJS — src/modules (features), src/core, src/shared; prisma/ (schema, migrations)
apps/frontend/  React — src/routes (pages), src/features (feature folders), src/components (UI kit)
```

Working conventions for AI-assisted development: [`CLAUDE.md`](CLAUDE.md). UI rules every screen must follow: [`DESIGN.md`](DESIGN.md).
