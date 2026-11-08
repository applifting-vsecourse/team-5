# UX and UI Changes Report

**Date**: 2026-11-08  
**Scope**: All user experience (UX), user interface (UI), and interaction design changes merged into `dev` since 2026-10-26 (commits `ada5199` → `5815bab`).  
**Context**: Complete application redesign wave implementing the approved Figma specifications ([DESIGN.md](../DESIGN.md)), the shared UI components catalog ([ui-components.md](ui-components.md)), and design system foundations ([design-system-audit-171.md](design-system-audit-171.md)).

---

## Executive Summary

Between 26 October and 8 November 2026, TrainLoop underwent a comprehensive UX/UI overhaul across all core screens and flows. A total of **18 pull requests** with direct UX impact were merged, including the major integration PR **#212** (consolidating PRs 200–209 and post-review polish).

The redesign addresses consistency, accessibility, touch ergonomics, and role-tailored workflows:

- **Design system foundations**: Semantic color tokens, light mode enforcement (dark mode deferred per product owner decision; dark hero and sidebar retained as scoped accent surfaces), standard radii (`rounded-card`, `rounded-field`, `rounded-hero`, `rounded-sheet`), and WCAG-compliant contrast.
- **Mobile-first ergonomics & shared components**: Touch target enlargement (minimum 44 px for interactive items, 52 px for fields, 56 px for primary actions), mobile bottom tab navigation (`BottomNav`), and bottom sheet dialogs (`Drawer` / `ConfirmDestructiveDialog`) replacing intrusive modals on mobile devices.
- **Public pages & account lifecycle**: Reimagined landing page, dedicated role selection (Handler vs. Trainer) during registration, redesigned sign-in and password recovery, profile editing, e-mail change verification, and password-guarded account deletion.
- **Handler experience (Today & Week)**: Dominant Hero card with the current training and a 1-tap "Začít trénink" (Start training) action, redesigned week calendar with dog-color identity strips, and overdue indicators.
- **Dog management, diary & archive**: Dog identity colors (1–6) consistently reflected in avatars, headers, and calendar strips; private notes (`DogNote`) for lessons/seminars; dog archiving and reactivation workflows.
- **Goals & training execution**: Step-by-step goal editor, explicit step progression (Advance, Skip, Back), training walkthrough runner with integrated timer and mistake recording, and automatic cleanup of future planned trainings upon goal archiving.
- **Training records & feedback messaging**: Migration from dialogs to full-page records (`TrainingRecordPage`), distinct styling for trainer vs. handler messages, and instant "Reply" actions from history cards with auto-scroll to the composer.
- **Trainer workspace & clients**: Dedicated mobile `TrainerOverview` dashboard, client directory with performance heatmaps, structured scheduling workflows, and isolation of personal dogs pending multi-role context switching.

---

## Detailed Functional & UX Breakdown

### 1. Design System Foundations & Shared UI Kit

- **Figma Token Alignment (PR #176)**:
  - Consolidated all styling under CSS custom properties in `apps/frontend/src/styles/global.css`.
  - Added semantic pairs: `hero`/`hero-foreground`, `success`/`success-foreground`, `warning`/`warning-foreground`, `info`/`info-foreground`, and `card`/`card-foreground`.
  - Enforced light theme throughout the application (hiding theme switchers in headers and settings); scoped dark backgrounds exclusively to the `HeroCard` and the desktop `AppSidebar`.
  - Replaced ad-hoc border radii with token classes: `rounded-card`, `rounded-field`, `rounded-hero`, and `rounded-sheet`.
- **Shared Component Library (PR #178, #185)**:
  - Catalogued reusable components in `docs/ui-components.md`:
    - `HeroCard` & `HeroChip`: Highlight surface for primary actionable summary.
    - `StripCard`: Content card with optional dog-color identity strip on the left border.
    - `StatusChip`: Visual uppercase chips with semantic tones (`muted`, `accent`, `success`, `warning`, `info`, `danger`, `hero`).
    - `PesAvatar`: Standardized circular dog identity badge rendering with `text-dog-foreground`.
    - `PerformanceLegend`: Color-coded performance bands (<50%, 50–65%, 65–80%, ≥80%) with accessible contrast.
    - `QueryState` & `EmptyState`: Unified loading skeletons (`ListSkeleton`), empty states with iconography and actions, and error fallbacks with retry actions.
- **Touch Targets & Accessibility (PR #178, #185)**:
  - Standardized minimum interactive dimensions to ≥44×44 px.
  - Enlarged `CheckboxField` hit area to the full container row (`min-h-touch`).
  - Implemented accessible Radix-based keyboard focus rings with high-contrast outlines (`ring-2 ring-ring ring-offset-2`).
- **Mobile Navigation & Sheets (PR #178, #212)**:
  - Persistent `BottomNav` with role-based routing:
    - Handler: **Dnes** (Today) · **Týden** (Week) · **Psi** (Dogs) · **Účet** (Account).
    - Trainer: **Přehled** (Overview) · **Klienti** (Clients) · **Cíle** (Goals) · **Účet** (Account).
  - Replaced desktop-centric confirmation modals on mobile with swipeable Radix/Vaul bottom sheets (`ConfirmDestructiveDialog` / `Drawer`).

---

### 2. Public Pages, Authentication & Account Management

- **Landing Page Redesign (PR #175 via #212)**:
  - Rebuilt hero section, value propositions, feature highlights, and footer.
  - Integrated custom SVG graphics, progress ring indicators (`ProgressRing`), and responsive layout.
- **Authentication Flows (PR #175 via #212)**:
  - **Role Selection**: Registration flow starts with an explicit choice between _Psovod_ (Handler) and _Trenér_ (Trainer), establishing role permissions and navigation routes upfront.
  - **Sign In & Sign Up**: Redesigned on `AuthLayout` with `IconInput` and `PasswordInput` (toggleable password visibility).
  - **Recovery**: Rebuilt _Zapomenuté heslo_ (Forgot password) and _Obnova hesla_ (Password reset) screens with validation feedback.
- **Account Settings & Security (`/account`) (PR #175 via #212)**:
  - **Profile Management**: Inline editing of user profile information (`EditAccountDialog`).
  - **Email Change**: Requires confirmation link sent to the new email address before updating.
  - **Password Update**: Integrated password change form with security checks.
  - **Account Deletion**: Role-aware confirmation explaining exact data deletion consequences (e.g. impact on assigned client dogs for trainers vs. private dogs for handlers); enforces password verification; rendered as a bottom sheet on mobile.
  - **Trainer Invitation**: Dialog for handlers to enter invitation codes (`InviteCodeDialog` / `ConnectTrainerDialog`) to establish coach-client links.
- **Error & Loading UX (PR #175 via #212)**:
  - Redesigned 404 (Not Found) and error boundary screens (`ErrorLayout`, `RootErrorBoundary`) with self-service retry and navigation shortcuts.
  - Redesigned branded full-page loading screen (`AppLoadingScreen`).

---

### 3. Dog Management, Profile, Diary & Archive

- **Visual Dog Identity (PR #176, #190, #191)**:
  - Dogs maintain a stable color index (1–6) across all views (cards, calendar strips, avatars, headers).
  - Dog profile features a prominent, full-width colored header matching the dog's assigned tone with high-contrast foreground typography.
- **Private Notes & Restyled Diary (PR #170, #183, #184)**:
  - Handlers can record private notes from training lessons and seminars (`DogNote`).
  - Completely restyled the dog diary into card-based entries utilizing the shared UI kit, with search and entry creation actions.
- **Dog Archiving & Reactivation (PR #200 via #212)**:
  - Handlers can archive dogs when inactive, retired, or temporarily paused.
  - Confirmation dialog verifies the action.
  - Archived dogs are excluded from active dog lists, quick-pickers, and the weekly schedule.
  - Added dedicated **Archiv psů** section on `/dogs` allowing users to inspect past dogs and restore them to active status at any time.
  - Added direct link to dog training history inside `DogDetailView`.

---

### 4. Handler Workflows: Today & Week Scheduling

- **"Dnes" (Today) Dashboard (PR #179, #186, #190)**:
  - Large dark `HeroCard` presenting today's scheduled training session.
  - Primary action: 1-click **"Začít trénink"** button to immediately launch the session.
  - Displays completed exercises, progress metrics, and overdue warning indicators for missed planned sessions.
- **"Týden" (Week) Calendar (PR #179, #186, #191, #209 via #212)**:
  - Restyled 7-day calendar agenda matching Figma specifications.
  - Visual separation of days, dogs (via colored `StripCard` indicators), and completion statuses.
  - Improved week navigation affordances (previous/next week, current week indicators).
  - Direct action opening: clicking planned training cards initiates actions directly without redundant intermediary dialogs.

---

### 5. Goals, Step Tracking & Training Execution

- **Current Step Progression (PR #66 / #187, PR #206 via #212)**:
  - Introduced active step tracking in training goals.
  - Added explicit user controls to **Advance** (posunout), **Skip** (přeskočit), or **Step Back** (vrátit zpět) across step progressions.
  - Current step is clearly marked in both the goal builder and active walkthrough screens.
- **Goal Editor & Scheduling (PR #189, PR #201 via #212)**:
  - Multi-step goal editor allowing handlers and trainers to structure long-term milestones into sequential exercises.
  - **Goal Completion & Archive**: Completed or obsolete goals can be marked finished/archived.
  - **Automatic Calendar Cleanup**: Archiving a goal automatically purges all future `PLANNED` training sessions associated with that goal from the week view, keeping the calendar clean.
- **Training Walkthrough Runner (PR #188, #192)**:
  - Rebuilt active training execution screen.
  - Integrated training timer with start/pause/reset controls.
  - Separated local exercise navigation (previous/next exercise within the current workout) from global goal-step progression.
  - Post-session completion form capturing duration, detailed mistake notes, and difficulty ratings.

---

### 6. Training Records, History & Feedback Messaging

- **Full-Page Training Record (`TrainingRecordPage`) (PR #193, #204/#205 via #212)**:
  - Replaced small dialog popups with dedicated full-page routes (`/dogs/:dogId/activities/:activityId`).
  - Structured view of completed goals, exercise steps, metrics, and recorded notes.
- **Trainer/Handler Feedback Chat (PR #163/#205 via #212)**:
  - Dedicated message thread attached to each training record.
  - Distinct message bubble styling visually differentiating handler comments from trainer feedback.
- **History Card UX & Reply Shortcuts (PR #207, #209 via #212)**:
  - Direct **"Odpovědět"** (Reply) button on history list cards.
  - Clicking "Reply" navigates directly to the record and auto-scrolls down to the message input composer.
  - Migrated history views away from inline dialogs to direct routing via `activityId`.
  - Added dedicated navigation routes for `/inbox` and `/messages` (PR #208 via #212).

---

### 7. Trainer Workspace & Client Management

- **Mobile Trainer Overview (PR #182, #193)**:
  - Dedicated dashboard for trainers displaying key operational metrics: active clients, active dogs, completion rates, and recent client activity.
  - Quick-access buttons for trainer administrative workflows.
- **Client Directory & Heatmap (PR #182, #204 via #212)**:
  - Restyled client list (`ClientList`, `ClientCard`) and client detail screens.
  - Implemented client activity heatmaps using semantic performance bands (<50%, 50–65%, 65–80%, ≥80%).
- **Structured Client Scheduling (PR #204 via #212)**:
  - Enhanced trainer scheduling workflow requiring selection of client, dog, and specific goal before assigning scheduled workouts.
- **Role Context Isolation (PR #211 via #212)**:
  - Trainers' personally owned dogs are temporarily hidden from the trainer-specific dashboard view until dedicated multi-role context switching is implemented ([docs/trainer-own-dogs-followup.md](trainer-own-dogs-followup.md)).

---

### 8. Transactional Emails

- **Unified Email Design (PR #169)**:
  - Introduced standard `EmailLayout` component across all automated email templates (account confirmation, password reset, client invitations).
  - Matched application typography, brand colors, spacing, and header/footer structure.

---

## Merged Pull Requests Registry (since 2026-10-26)

| Date Merged    | PR / Branch                                       | Commit    | Summary of UX Impact                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :------------- | :------------------------------------------------ | :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2026-11-05** | **PR #169** (`new-e-mail`)                        | `0098f64` | `feat(email)`: Sjednocení vzhledu e-mailových šablon s design systémem aplikace.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **2026-11-05** | **PR #170** (`feature/70-dog-notes`)              | `9a6e7c7` | `feat(dog)`: Soukromé poznámky z lekcí a seminářů pro psovody.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **2026-11-05** | **PR #176** (`feature/171-design-system`)         | `d878929` | Redesign: Sjednocení designového základu a tokenů podle schválené Figmy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **2026-11-05** | **PR #178** (`feature/172-shared-ui-components`)  | `afe9ec2` | `feat(ui)`: Sdílené UI komponenty, mobilní spodní navigace a mobilní bottom sheet dialogy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **2026-11-05** | **PR #179** (`feature/161-dnes-tyden`)            | `6a1c3aa` | `feat(today)`: Nová obrazovka Dnes a restyling Týdne pro psovoda.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **2026-11-05** | **PR #182** (`feature/173-trainer-overview`)      | `d9e33d7` | `feat(client)`: Mobilní přehled trenéra a restyling seznamu klientů.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **2026-11-05** | **PR #183** (`feature/163-dogs-profile-diary`)    | `783fec9` | `feat(dog)`: Restyle seznamu, profilu a historie psů se sdíleným UI kitem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **2026-11-06** | **PR #184** (`feature/163-dog-diary-restyle`)     | `3eb48a0` | `feat(dog)`: Restyle sekce deníku psa se sdíleným UI kitem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **2026-11-06** | **PR #185** (`feature/172-shared-ui-finish`)      | `f4dd2ea` | `feat(ui)`: Dokončení katalogu komponent, a11y dotykových ploch (44px) a CheckboxField.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **2026-11-06** | **PR #186** (`feature/161-dnes-tyden-polish`)     | `0a1b541` | `feat(today)`: Začít trénink CTA na kartách plánu, opožděné tréninky.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **2026-11-06** | **PR #187** (`feature/66-current-step`)           | `4aa870f` | `feat(goals)`: Sledování aktuálního kroku cíle (posun, přeskočení, návrat).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **2026-11-06** | **PR #188** (`feature/162-walkthrough-redesign`)  | `deba307` | `feat(training)`: Redesign průchodu tréninkem, časovač, formulář dokončení s chybami.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **2026-11-07** | **PR #189** (`feature/164-goals-training-editor`) | `f8512e6` | `feat(goals)`: Redesign cílů, editoru a plánování tréninků.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **2026-11-07** | **PR #190** (`feature/figma-psi-dnes`)            | `54e0a2e` | `feat(ui)`: Karty psů a metriky Dnes s reálnými daty podle Figmy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **2026-11-07** | **PR #191** (`feature/figma-tyden-profil`)        | `1c6dcbd` | `feat(ui)`: Týdenní agenda a velká barevná hlavička psa.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **2026-11-07** | **PR #192** (`feature/figma-pruchod`)             | `8c002e1` | `feat(ui)`: Průchod cvičením s časovačem a karty záznamu.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **2026-11-07** | **PR #193** (`feature/figma-historie-prehled`)    | `95484f7` | `feat(ui)`: Historie se záznamem a metriky přehledu trenéra.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **2026-11-08** | **PR #212** (`fix/ready-prs-without-166`)         | `5815bab` | **Integrace PR 200–209 a UX opravy historie, záznamu a plánování**: <br>• **PR #200**: Archiv a návrat psa, link na historii v detailu psa.<br>• **PR #201**: Dokončení a archiv cíle s odstraněním budoucích tréninků.<br>• **PR #203 (#175)**: Redesign veřejných stránek, registrace s výběrem role, přihlášení a správa účtu.<br>• **PR #204/#205**: Celostránkový záznam tréninku s bloky cílů, odlišení zpráv v chatu, seznam klientů.<br>• **PR #206**: Zobrazení a editace aktuálního kroku v cíli.<br>• **PR #207/#208**: Navigace v záznamu přes `activityId`, routy pro zprávy a inbox.<br>• **PR #209**: Polish přepínače týdnů, tlačítko Odpovědět na kartách historie. |
