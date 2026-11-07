# TrainLoop design contract

Read before changing UI. The product owner approved the new direction in the
implementation conversation on 4 November 2026. The Figma annotation
“K DISKUZI, NESCHVÁLENO” is historical.

## Sources and scope

- [Foundations and palette](https://www.figma.com/design/IjEnmXXeJB8YBOWPjWiFu3/Trainloop-wireframe?node-id=110-718)
- [Today](https://www.figma.com/design/IjEnmXXeJB8YBOWPjWiFu3/Trainloop-wireframe?node-id=114-825)
- [Dog profile](https://www.figma.com/design/IjEnmXXeJB8YBOWPjWiFu3/Trainloop-wireframe?node-id=119-989)
- [Trainer desktop](https://www.figma.com/design/IjEnmXXeJB8YBOWPjWiFu3/Trainloop-wireframe?node-id=128-1679)
- [Additional screens, series 08](https://www.figma.com/design/IjEnmXXeJB8YBOWPjWiFu3/Trainloop-wireframe?node-id=235-749)

Series 05 experiments, including its dark Today mockup, are outside this redesign.
Dark mode is temporarily deferred by the product owner (4 November 2026). The
application currently forces light mode, including users with a saved dark/system
preference; appearance controls are hidden in both the header and account. Keep
the dark tokens and their contrast checks for later reactivation. The dark hero
surface remains part of the light design and is not dark mode.

`apps/frontend/src/styles/global.css` is the only source of token values. This
contract defines their meaning. Translate Figma intent into these tokens; do not
copy raw colours into feature components. Reuse `src/components/ui/` controls;
prefer token styling over rewriting the vendored shadcn kit. #171 supplies the
foundations; #172 shared components are catalogued in
[`docs/ui-components.md`](docs/ui-components.md). Screen tickets adopt them.
Existing screens are not all redesigned by #171.

## Colour and states

Use semantic utilities only, including SVG strokes and charts. No hex, RGB or
Tailwind palette colours in feature code.

| Tokens                                                 | Meaning                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `background`, `foreground`                             | Page canvas and body text                                    |
| `card`, `card-foreground`                              | Distinct content or metric surface                           |
| `popover`, `popover-foreground`                        | Floating menus and dialogs                                   |
| `secondary`, `secondary-foreground`                    | Quiet grouping and secondary actions                         |
| `muted`, `muted-foreground`                            | Subdued surface and supporting text on neutral surfaces      |
| `primary`, `primary-foreground`                        | Main action and active navigation                            |
| `accent`, `accent-foreground`                          | Hover/selected surface, not an extra brand colour            |
| `destructive`, `destructive-foreground`                | Errors and destructive actions                               |
| `hero`, `hero-foreground`, `hero-muted`, `hero-accent` | Dark training summary, text, supporting text and inset chips |
| `success`, `success-foreground`                        | Completed/successful state surface and text                  |
| `warning`, `warning-foreground`                        | Attention needed, accompanied by an explanation              |
| `info`, `info-foreground`                              | Informational feedback                                       |
| `border`, `input`, `ring`                              | Hairline separators, field borders and keyboard focus        |

Pair each surface with its corresponding foreground. Use `text-success-foreground`,
not `text-success`, for status text. Errors need text or an icon, not colour alone.
Loading uses a neutral skeleton and accessible status. Pending actions show
progress and prevent duplicate submission. Keep disabled actions labelled. One
primary action per view; others use outline, secondary, ghost or a link. Series,
trends and completed steps require real data from their own tickets.

## Dog identity

A dog's stored index 1–6 stays the same across lists, calendar, profile and charts.
Use `dogColorClass`/`dogRingClass` from `lib/dogColors.ts`; unknown values fall back
to dog-1. Never derive colour from sort order or remap it in dark mode.

Dog colour can fill an avatar, dog summary card or profile header. This replaces
the previous restriction to strips and dots. Use `text-dog-foreground` at full
opacity, including supporting text: translucent white in the mockup is not a safe
small-text default. A name or initials must identify the dog too. Charts need
labels and values so hue is not the only way to read them. Dog colours never mean
success, failure or actions.

Exception requested in the implementation review on 6 November 2026: numbered step badges
in the training editor cycle through dog-1 to dog-6 by position, repeating after
six steps. These colours identify positions. The editor does not highlight the
dog's current step or show progress-specific hints; progress belongs to the
training walkthrough.

Review decisions, 7 November 2026: Moji psi has one add-dog action, the bottom
Přidat psa card; omit the duplicate header plus. Dog cards show completed goals
out of all goals. Dnes aggregates all owned active dogs: sum each dog's weekly
goal and trained days (a dog counts once per day), calculate the streak across
the owner's training days and weight success rates by actual rated records.

## Typography and spacing

Use `font-sans` (Plus Jakarta Sans with the existing fallback stack) for headings,
names, controls and body. The approved design does not introduce a serif diary
style. No application code uses a serif token; the old override and unused Geist
Sans import have been removed. Use `font-mono` only for codes.

One h1 per page, sequential heading levels. Page titles use text-2xl/text-3xl,
font-extrabold and tracking-tight; sections use text-lg/text-xl and font-bold.
Body is text-base, support text-sm, short labels text-xs. Use relaxed body leading
and tight headings. Sentence case, except short uppercase chips shown in Figma.

Use Tailwind spacing units 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 12, 16. This
includes the mobile and desktop gutters in Figma. Related items use
gap-2/gap-3, separate blocks gap-6/gap-8. No arbitrary pixel values in feature UI.
Control dimensions use the semantic `touch` and `action` tokens.

## Surfaces and hero

Cards may contain a dog, training, metric or coherent dashboard section such as
goals or client activity. This replaces the previous list-items-only rule. A page
stays on background, not inside a card. Inside cards use spacing, dividers and
quiet surfaces rather than nesting bordered cards. Avoid decorative filler.

The dark `bg-hero text-hero-foreground` summary is allowed for the next training
or one highlighted metric. Support uses text-hero-muted, inset chips bg-hero-accent.
Keep one clear main action; do not turn every metric into a hero.

Use rounded-card (also rounded-xl) for cards, rounded-hero (also rounded-2xl) for
hero summaries, rounded-control for prominent actions. Existing rounded-md/lg
remain for compact kit controls. Use single hairline borders. Cards and inputs
have no shadows; shadow tokens are for floating menus, dialogs and toasts.

## Responsive layout and navigation

Mobile first at roughly 390–402px, supporting 320px without horizontal page scroll.
Keep actions reachable outdoors with one hand. Full-width main actions sit near
the bottom of their flow, clear of navigation and safe areas. Reserve space for
fixed controls; the native phone status bar in Figma is not an app component.

| Width / role           | Behaviour                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Below md / handler     | Single column; bottom bar Dnes · Týden · Psi · Účet. Dnes is the default overview.                                                                                    |
| Below md / trainer     | Single column; bottom bar Přehled · Klienti · Cíle · Účet, matching the trainer tab-bar reference. Own dogs and calendar remain reachable from the overview.          |
| md to lg / both        | Sidebar navigation, with content reflowing where space permits. Preserve destinations and active state; the global top bar was removed by user request on 7 November. |
| lg and above / trainer | Dark persistent sidebar, flexible main workspace and contextual dog/client panel. Editor/calendar can use wider workspaces.                                           |
| lg and above / handler | Sidebar and overview grid for next training, progress and dogs. Constrain reading/form widths.                                                                        |

Use Tailwind md (48rem) and lg (64rem) transition points. Reading/forms use
max-w-2xl, calendars max-w-4xl, dashboards can expand to max-w-7xl. The 1440px
Figma frame is a reference, not a required viewport. Stack panels before overflow.

Active navigation combines an accent surface, primary text and aria-current.
Use labelled links and icons. During walkthroughs, dedicated step controls replace
the bottom tabs so they do not overlap. Public/auth pages keep app identity and
appropriate public navigation. Route/sidebar adoption belongs to screen tickets.

## Forms, states and accessibility

Every input has a visible label; placeholders are examples. Validate on client and
server, associating field errors via aria-describedby. Allow untouched forms to
submit and reveal errors. Buttons are buttons, links are links, and icon-only
controls have accessible names.

Touch controls are at least min-h-touch/min-w-touch (44 × 44px). Global styles give
the shared Button this floor even for compact variants. Its lg size is the 56px
main action. Never clip or transform away the target. Small checkboxes/radios get
a clickable labelled wrapper supplying the target; calendar cells need it too.

Keyboard focus uses a solid offset outline, independent of translucent kit rings.
Dog/hero containers use a contrasting light outline. Never remove or clip focus;
keep it visible through sticky headers, dialogs and bottom controls. Text contrast
is at least 4.5:1, focus indicators at least 3:1 against adjacent surfaces. Token
measurements and remaining adoption work live in docs/design-system-audit-171.md.

When dark mode is reactivated, light/dark/system must share semantics, layout and dog identity. Never invert dog fills.
Respect reduced motion for optional transitions and celebrations.

Every list has loading, empty and error states. Empty states explain what will
appear and offer a relevant action. Errors offer retry. Refresh normal data via
query invalidation and refetch on focus, not a manual reload action.

## Foundation recipes for the complete redesign

These recipes are the starting point for #172 and every screen ticket. Values
come from `global.css`; use these semantic utilities instead of adding per-screen
colour, radius, typography or control-size constants.

| Pattern / inspected reference                   | Foundation recipe                                                                                                                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page title / Today and Week                     | `text-page font-extrabold tracking-tight text-foreground`                                                                                                                   |
| Dog name / training step                        | `text-title font-extrabold tracking-tight`; dog headers use `text-dog-foreground`                                                                                           |
| Section heading                                 | `text-section font-extrabold`                                                                                                                                               |
| Main action label / timer                       | `text-action font-bold`; timer `text-timer font-extrabold tabular-nums`                                                                                                     |
| Compact supporting label                        | `text-label text-muted-foreground`; keep full opacity                                                                                                                       |
| Primary action                                  | `bg-primary text-primary-foreground min-h-action rounded-control`, with visible focus and pending state                                                                     |
| Input / sign-in and training forms              | `min-h-field rounded-field border-input bg-card text-card-foreground`; visible label and associated error                                                                   |
| Calendar training row / client row              | `rounded-item border-border bg-card text-card-foreground`; dog-colour identity strip and labelled status                                                                    |
| Goal / metric / dog content section             | `rounded-card border-border bg-card text-card-foreground`                                                                                                                   |
| Hero / selected day / selected segmented option | `bg-hero text-hero-foreground`; only the summary uses `rounded-hero`; support uses `text-hero-muted`                                                                        |
| Positive delta inside hero                      | `text-hero-positive` with a trend label; neutral cards use `text-success-foreground`                                                                                        |
| Error panel / destructive confirmation          | `bg-danger-surface text-danger-foreground` for the error icon/status; destructive action uses `bg-destructive text-destructive-foreground`                                  |
| Modal overlay / bottom sheet                    | `bg-overlay`; sheet `rounded-t-sheet bg-background`, desktop dialog `rounded-sheet`; retain Radix focus management and escape/close controls                                |
| Desktop sidebar                                 | `w-sidebar bg-sidebar text-sidebar-foreground`; supporting labels `text-sidebar-muted`, quiet hover `bg-sidebar-accent`, active action `bg-primary text-primary-foreground` |
| Editor library / contextual dog panel           | `w-context shrink-0` only at wide widths; stack below lg                                                                                                                    |
| Mobile content / desktop workspace              | `px-gutter lg:px-gutter-desktop`; `min-w-0` on grid/flex content                                                                                                            |
| Bottom navigation and fixed actions             | `min-h-tab-bar pb-safe-bottom`; content reserves that height plus safe area and spacing; walkthrough actions replace the tab bar                                            |
| Progress tracks / loading skeletons             | `bg-chart-track` for track, `bg-muted` skeleton; progress fill uses primary or dog colour according to the data meaning                                                     |

`rounded-full` is reserved for pills and circular avatars, not page cards. Compact
chips are visual labels; when clickable, their wrapper still supplies a full
`touch` target. Fields use `field` (52px); touch controls use `touch` (44px); main
actions use `action` (56px). The 36px mockup row buttons are enlarged to the touch
minimum rather than copied literally.

The client activity heatmap has a different meaning from dog identity. Use
`bg-performance-low` for <50%, `bg-performance-medium` for 50?<65%,
`bg-performance-high` for 65?<80%, `bg-performance-top` for >=80%, and
`bg-performance-empty` for no training. Keep a labelled legend and numeric values;
no-training is not zero success. Intermediate colours reproduce Figma blends on
white cards and are chart marks only, not text or reusable status colours. Dog
trend charts instead retain the dog's stored colour. Never hardcode these band
colours or thresholds independently in multiple feature components.

The desktop sidebar remains dark within the light app; this is a scoped surface,
not a reactivation of dark mode. Text and neutral controls inside hero/sidebar
surfaces must use their matching tokens. Do not put muted-foreground on a dark
surface. Dialogs are portalled to neutral surfaces and use the normal ring token.
