# Shared UI components (#172)

Catalogue for redesign screen tickets. Does not supersede DESIGN.md — it points
implementers at shared building blocks. Linked from DESIGN.md foundations section.

| Component                     | Path                                   | When to use                                                                              |
| ----------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Button`                      | `components/ui/button`                 | Actions. Default ≥ 44×44; `size="lg"` ≥ 56 px main action. One primary per view.         |
| `Input`                       | `components/ui/input`                  | Fields (`min-h-field`, `rounded-field`). Always with a visible label.                    |
| `CheckboxField`               | `components/CheckboxField`             | Labelled checkbox row with `min-h-touch`. Do not enlarge the radix box itself.           |
| `Badge`                       | `components/ui/badge`                  | Small non-uppercase tags. Prefer `StatusChip` for Figma uppercase chips.                 |
| `StatusChip`                  | `components/StatusChip`                | Uppercase labels (`BEZ PSA`, `CHYBA`, `nový`). Visual only — wrap if clickable.          |
| `EmptyState`                  | `components/EmptyState`                | Empty screens/lists: chip + icon + title + one sentence + primary action.                |
| `QueryState` / `ListSkeleton` | `components/QueryState`                | Every list: loading, empty, error+retry. Pass `empty` as `EmptyState`.                   |
| `StripCard`                   | `components/StripCard`                 | List row/card with optional dog-colour strip (`dogColor` 1–6).                           |
| `Metric`                      | `components/Metric`                    | Number + short label. Set `isOnHero` inside `HeroCard`.                                  |
| `HeroCard` / `HeroChip`       | `components/HeroCard`                  | One dark summary per view (next training / highlight).                                   |
| `PerformanceLegend`           | `components/PerformanceLegend`         | Colour key for success-rate bands; use with `performanceBands` helpers.                  |
| `ConfirmDestructiveDialog`    | `components/ConfirmDestructiveDialog`  | Irreversible delete/confirm. Mobile bottom sheet, md+ centred dialog. Red only here.     |
| `Drawer*`                     | `components/ui/drawer`                 | Mobile bottom sheet (`bg-overlay`, `rounded-t-sheet`). Desktop dialogs stay on `Dialog`. |
| `Dialog*` / `AlertDialog*`    | `components/ui/dialog`, `alert-dialog` | Centred modals; overlays use `bg-overlay`.                                               |
| `BottomNav`                   | `components/BottomNav`                 | Mobile tabs: handler Dnes·Týden·Psi·Účet; trainer Přehled·Klienti·Cíle·Účet.             |
| `PesAvatar`                   | `components/PesAvatar`                 | Dog identity circle; uses `text-dog-foreground`.                                         |

## Variants

### `StatusChip` — `tone`

`muted` · `accent` · `success` · `warning` · `info` · `danger` · `hero`

### `EmptyState`

| Prop       | Values / notes                                      |
| ---------- | --------------------------------------------------- |
| `iconTone` | `primary` (default) · `dog` · `danger`              |
| `titleAs`  | `h2` (default) · `p` when nested under a section    |
| `chip`     | optional uppercase label                            |
| `action`   | primary CTA; `secondaryAction` for a quieter second |

### `QueryState`

| Prop               | Notes                                                 |
| ------------------ | ----------------------------------------------------- |
| `loadingLabel`     | `aria-label` on `role="status"` while loading         |
| `errorTitle`       | heading in the error EmptyState                       |
| `errorDescription` | fallback when `error.message` is empty                |
| `errorChip`        | EmptyState chip; default `CHYBA`; pass `null` to hide |
| `skeleton`         | override `ListSkeleton`                               |
| `empty`            | required; usually `<EmptyState … />`                  |

### `StripCard`

| Prop       | Notes                                     |
| ---------- | ----------------------------------------- |
| `dogColor` | 1–6 → left strip; omit for a neutral card |
| `as`       | `article` (default) · `div` · `li`        |

### `Metric`

| Prop       | Notes                                   |
| ---------- | --------------------------------------- |
| `isOnHero` | use hero foreground / muted text tokens |

### `HeroCard`

| Prop      | Notes                                          |
| --------- | ---------------------------------------------- |
| `eyebrow` | optional uppercase line above the main content |

`HeroChip` is the quiet inset pill on the hero surface.

### `PerformanceLegend` / `performanceBands`

Thresholds: `<50` low · `50–65` medium · `65–80` high · `≥80` top · missing → empty.
Helpers: `performanceBandForRate`, `performanceBandClass` in `lib/performanceBands.ts`.

### `BottomNav`

| Prop        | Notes                                            |
| ----------- | ------------------------------------------------ |
| `isTrainer` | Přehled·Klienti·Cíle·Účet vs Dnes·Týden·Psi·Účet |
| walkthrough | routes under `/trainings/*` hide the bar         |
| account tab | may render `accountMenu` instead of a plain link |

### `ConfirmDestructiveDialog`

| Prop                      | Notes                                                 |
| ------------------------- | ----------------------------------------------------- |
| `trigger`                 | required control that opens the dialog                |
| `isOpen` / `onOpenChange` | optional controlled mode                              |
| viewport                  | Drawer below `md`, centred `AlertDialog` from `md` up |

### `CheckboxField`

`id` + `label` + `checked` + `onCheckedChange`. Row is `min-h-touch`; checkbox stays `size-4`.

### `Button` (shadcn)

Variants: `default` · `secondary` · `outline` · `ghost` · `destructive` · `link`.
Sizes: default ≥ 44×44; `lg` ≥ 56 px for the one primary action per view.

## Navigation destinations

| Role    | Mobile / md header                                    | Notes                                                                                       |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Handler | Dnes → `/dashboard`, Týden, Psi, Účet                 | Dnes content is a screen ticket (#161).                                                     |
| Trainer | Přehled → `/dashboard`, Klienti, Cíle → `/dogs`, Účet | Calendar (`/week`) and own dogs stay reachable from Přehled; Cíle keeps `/dogs` until #164. |

Walkthrough routes (`/trainings/*`) hide the tab bar.

## Do not

- Hardcode hex / Tailwind palette colours in features.
- Nest bordered cards inside cards.
- Invent a second empty/error pattern beside `QueryState` + `EmptyState`.
- Use `destructive` for emphasis — only errors and irreversible actions.
- Enlarge the radix checkbox to 44 px — use `CheckboxField` for the touch target.
