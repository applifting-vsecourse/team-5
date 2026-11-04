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
foundations; #172 and the screen tickets adopt them. Existing screens are not all
redesigned by #171.

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

## Typography and spacing

Use `font-sans` (Plus Jakarta Sans with the existing fallback stack) for headings,
names, controls and body. The approved design does not introduce a serif diary
style. Keep `font-serif` only for compatibility; use `font-mono` for codes.

One h1 per page, sequential heading levels. Page titles use text-2xl/text-3xl,
font-extrabold and tracking-tight; sections use text-lg/text-xl and font-bold.
Body is text-base, support text-sm, short labels text-xs. Use relaxed body leading
and tight headings. Sentence case, except short uppercase chips shown in Figma.

Use Tailwind spacing units 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 12, 16. This
includes the 20px mobile and 28px desktop gutters in Figma. Related items use
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

| Width / role           | Behaviour                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Below md / handler     | Single column; bottom bar Dnes · Týden · Psi · Účet. Dnes is the default overview.                                                                           |
| Below md / trainer     | Single column; bottom bar Přehled · Klienti · Cíle · Účet, matching the trainer tab-bar reference. Own dogs and calendar remain reachable from the overview. |
| md to lg / both        | Existing header navigation, with content reflowing to two columns where space permits. Preserve destinations and active state.                               |
| lg and above / trainer | Dark persistent sidebar, flexible main workspace and contextual dog/client panel. Editor/calendar can use wider workspaces.                                  |
| lg and above / handler | Sidebar and overview grid for next training, progress and dogs. Constrain reading/form widths.                                                               |

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
