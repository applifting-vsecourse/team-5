# Trainer desktop overview (Refs #174)

The overview expands at the desktop breakpoint to show a client activity matrix
beside a selected dog's context. The existing mobile overview remains available.

## Changes

- Fourteen inclusive Czech calendar days of completed training, with daily success
  and a fortnight average weighted by rated sessions. Future and skipped records
  are excluded. No training, unrated training and a real zero rating are distinct.
- Client selection updates the context panel; clients with several shared dogs
  can switch dogs. The panel includes breed, eight-week success, active goals,
  mastered steps, deadlines, latest completed training and its note.
- Goal links retain the selected dog's context. Conversation actions open the
  selected training. The existing repository filters continue to restrict data
  to connected clients' non-archived dogs shared with the current trainer.
- Desktop invitation entry point; no duplicate invitation action in the empty state.

The overview API response is extended without a schema migration. Existing mobile
fields remain intact. Private diary notes are not selected or exposed.

## Validation

- Backend: 329 tests across 36 suites and build passed in the integration checkout.
- Frontend: eight overview interaction tests, type-check and changed-file lint passed.
- Combined integration checkout: 316 frontend tests across 60 files passed with
  `pnpm frontend test:ci --maxWorkers=2`. An initial unrestricted run hit resource
  contention/timeouts; the bounded rerun passed.
- Desktop render inspected against a local API and seeded PostgreSQL database.

## Remaining work

This is part of #174, not completion of the whole issue. Full mobile/intermediate/
desktop interaction review remains, along with desktop search, a true unread KPI,
the three-column editor and final Figma fidelity work. The unread metric must use
read state, not the count of recent messages. PR #166 contains related work that
requires integration review. Experiments are excluded from this redesign.

This branch is based on `feature/figma-historie-prehled` (PR #193), so its PR must
target that branch until the underlying stack is merged. It does not include the
separate demo-seed PR or later editor fixes from the combined local preview.
