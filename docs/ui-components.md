# Shared UI components (#172)

Catalogue for redesign screen tickets. Does not supersede DESIGN.md — it points
implementers at shared building blocks. Linked from DESIGN.md foundations section.

| Component                     | Path                                   | When to use                                                                              |
| ----------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Button`                      | `components/ui/button`                 | Actions. Default ≥ 44×44; `size="lg"` ≥ 56 px main action. One primary per view.         |
| `Input`                       | `components/ui/input`                  | Fields (`min-h-field`, `rounded-field`). Always with a visible label.                    |
| `Badge`                       | `components/ui/badge`                  | Small non-uppercase tags. Prefer `StatusChip` for Figma uppercase chips.                 |
| `StatusChip`                  | `components/StatusChip`                | Uppercase labels (`BEZ PSA`, `CHYBA`, `nový`). Visual only — wrap if clickable.          |
| `EmptyState`                  | `components/EmptyState`                | Empty screens/lists: chip + icon + title + one sentence + primary action.                |
| `QueryState` / `ListSkeleton` | `components/QueryState`                | Every list: loading, empty, error+retry. Pass `empty` as `EmptyState`.                   |
| `StripCard`                   | `components/StripCard`                 | List row/card with optional dog-colour strip (`dogColor` 1–6).                           |
| `Metric`                      | `components/Metric`                    | Number + short label. Set `isOnHero` inside `HeroCard`.                                  |
| `HeroCard` / `HeroChip`       | `components/HeroCard`                  | One dark summary per view (next training / highlight).                                   |
| `ConfirmDestructiveDialog`    | `components/ConfirmDestructiveDialog`  | Irreversible delete/confirm. Red only here.                                              |
| `Drawer*`                     | `components/ui/drawer`                 | Mobile bottom sheet (`bg-overlay`, `rounded-t-sheet`). Desktop dialogs stay on `Dialog`. |
| `Dialog*` / `AlertDialog*`    | `components/ui/dialog`, `alert-dialog` | Centred modals; overlays use `bg-overlay`.                                               |
| `BottomNav`                   | `components/BottomNav`                 | Mobile tabs: handler Dnes·Týden·Psi·Účet; trainer Přehled·Klienti·Cíle·Účet.             |
| `PesAvatar`                   | `components/PesAvatar`                 | Dog identity circle; uses `text-dog-foreground`.                                         |

## Navigation destinations

| Role    | Mobile / md header                                    | Notes                                                  |
| ------- | ----------------------------------------------------- | ------------------------------------------------------ |
| Handler | Dnes → `/dashboard`, Týden, Psi, Účet                 | Dnes content is a screen ticket (#161).                |
| Trainer | Přehled → `/dashboard`, Klienti, Cíle → `/dogs`, Účet | Cíle keeps `/dogs` until the goals route lands (#164). |

Walkthrough routes (`/trainings/*`) hide the tab bar.

## Do not

- Hardcode hex / Tailwind palette colours in features.
- Nest bordered cards inside cards.
- Invent a second empty/error pattern beside `QueryState` + `EmptyState`.
- Use `destructive` for emphasis — only errors and irreversible actions.
