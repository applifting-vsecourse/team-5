# Local staging feedback comparison

Both copies start from GitHub `main` commit `e6732389cdf42430d79f5efc56c3ae64991edae7` (PR #142). The remote was fetched before creating the copies. The implementation is on the local branch `codex/staging-feedback`. Nothing is pushed or deployed. Existing work in `team-5` is independent of these copies.

## Start and stop

Requires Node 24, pnpm, and running Docker Desktop. From this repository:

```powershell
./scripts/start-comparison.ps1
# Subsequent starts with already-built source:
./scripts/start-comparison.ps1 -SkipBuild
# Stop both copies, preserving their data and photos:
./scripts/start-comparison.ps1 -Stop
```

There is also a `Start-Comparison.ps1` wrapper in the parent TrainLoop directory. The launcher creates a sibling `comparison-main` checkout if needed and refuses to overwrite tracked changes there. It writes local `.env` files in the two comparison copies. Runtime logs, process IDs, and photos live in the sibling `.comparison` directory. These files are not part of the implementation branch.

| Build         | Frontend              | API                       | Database port |
| ------------- | --------------------- | ------------------------- | ------------- |
| Original main | http://localhost:3050 | http://localhost:4050/api | 5435          |
| Feedback      | http://127.0.0.1:3051 | http://127.0.0.1:4051/api | 5436          |

Use the hostnames exactly as shown. `localhost` and `127.0.0.1` keep authentication cookies separate; changing ports alone would not. Each build has its own database container/volume and photo directory. Neither uses the existing development database on port 5433. Stopping preserves all comparison data. Emails use the console mailer.

## Demo: two views

Use only these two seeded accounts, each with password `password1`:

| View   | Login                 |
| ------ | --------------------- |
| Trenér | `trener@trainloop.cz` |
| Psovod | `jan.novak@seznam.cz` |

1. As the trainer, open **Klienti → Jan Novák → Rex**. Create **Spolehlivá chůze u nohy**, describe the principle, and add exercises with instructions and completion criteria.
2. In **Tréninky k cíli**, schedule a future Tuesday, then use **Přidat další trénink** for Thursday and Saturday. The same goal and exercises remain; all three sessions are listed separately. Try the same sequence on main: it only allows the first planned session.
3. Log out from the profile menu (or the bottom **Účet** icon on mobile) and sign in as the handler. Open **Týden**, choose the corresponding week and days, and inspect the sessions. A session links back to its goal.
4. Open Rex's profile, edit it, upload a JPG/PNG/HEIC/HEIF photo, save, then refresh. The photo should remain. Replacement and removal are supported. Only the owner edits a dog's photo.
5. Return to the goal: its principle and exercises are shown as a readable overview. **Upravit cíl** opens editing. The schedule remains separate below the exercises.

The independent-handler flow is not extended or promoted for this demo. Existing registration and accounts remain available. Moving/skipping sessions and the exercise walkthrough are separate work not present in this pinned main revision; this change does not claim to implement them.

## Behavior and scope

- A goal is a reusable outcome, principle, and exercise plan. A training is one dated session linked to it. Adding another day creates a new session without changing existing dates or the goal.
- Duplicate _planned_ sessions for the same goal and day return HTTP 409. A transaction locks the goal row, so concurrent double submissions cannot create duplicates. Different days are allowed, including concurrent requests. Past dates and unauthorized access remain rejected.
- Existing database tables already model this relationship. No schema migration or data reset is needed; the Prisma change only corrects the model comment. Existing sessions are preserved.
- The goal page now emphasizes reading and scheduling, with explicit editing, clearer headings, wrapping long titles, and touch-sized actions. Mobile retains the app header and bottom navigation. The repository's semantic colors and UI kit are preserved.
- Dog image URLs retain the API prefix so they work when staging proxies `/api` only. Existing `/uploads/...` database values are supported. Upload validation accepts valid phone images with missing/generic MIME metadata while still checking their contents, extension, dimensions, and size. `.heif` is accepted consistently by the picker.
- The linked Figma file could not be accessed. Design changes follow `DESIGN.md` and the existing components; no pixel-for-pixel Figma verification is claimed.

## Checks

Standard checks remain available with `pnpm check-all`. The additional HTTP regression test runs against the seeded local feedback stack and creates/removes its own fixture dog:

```powershell
cd apps/backend
node --env-file=.env --test test/staging-feedback.http.test.mjs
```

It checks trainer/handler scheduling on several days, concurrent double submissions, week visibility, date/access rejection, and real photo upload/reload/replacement/removal. Run it only against the local comparison database. The final verification results are recorded in `VERIFICATION.md`.

## Review or push later

```powershell
git diff e6732389cdf42430d79f5efc56c3ae64991edae7
git status
```

Review the local branch before pushing it. Keep `.env`, `.comparison`, database volumes, and uploaded photos out of Git. The project integrates feature work into `dev` through a PR; `main` is staging.
