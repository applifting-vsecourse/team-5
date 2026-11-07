# Design system audit — #171

The product owner confirmed the new Figma direction on 4 November 2026.
Implementation is on `feature/171-design-system`.

## Mapping to implementation

| Design source                              | Result                                                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Figma 110:718 palette                      | Existing light colours and dog-1…6 match; preserved.                                                             |
| Today 114:825 dark summary                 | Added hero, hero-foreground, hero-muted and hero-accent semantic utilities.                                      |
| Dog profile 119:989                        | Added dog-foreground; contract permits dog-colour headers and cards. Keep supporting text opaque for contrast.   |
| Profile completion chips                   | Added success surface/foreground. Warning and info pairs complete system feedback semantics.                     |
| Today/profile/desktop typography           | Retained Plus Jakarta Sans; new contract uses sans headings, not the local serif diary proposal.                 |
| Card/hero/action radii                     | Added rounded-card, rounded-hero and rounded-control; xl/2xl now map to card/hero radii.                         |
| Controls                                   | Added touch/action dimensions. Shared Button has a 44px minimum; lg main action has a 56px minimum.              |
| Focus                                      | Solid offset outline takes precedence over kit outline-none. Hero/dog containers use a light outline.            |
| Desktop 128:1679 and trainer tabs 110:1001 | Contract specifies trainer sidebar/context panel, handler overview, mobile destinations and intermediate layout. |
| Existing theme switcher                    | Light mode forced for now; dark foundations retained. Dog indices are stable. Series 05 excluded.                |

All values live in `apps/frontend/src/styles/global.css`; components use semantic
classes. Dark success/warning/info pairs are accessibility adaptations because the
experimental dark screen is outside this ticket. No static Figma image assets are
needed for tokens or the contract.

## Contrast verification

Run `node scripts/check-design-tokens.mjs`. It reads the actual CSS declarations,
merges inherited dark tokens and computes WCAG sRGB contrast without rounding
before assertions. It checks 39 pairs per theme: neutral body/supporting text,
surface foregrounds, dog labels, hero text/chips, and focus on neutral surfaces.

| Theme | Lowest text contrast               | Lowest neutral focus contrast  |
| ----- | ---------------------------------- | ------------------------------ |
| Light | 4.52:1, muted-foreground on accent | 4.45:1, ring against accent    |
| Dark  | 4.92:1, dog-foreground on dog-5    | 5.16:1, ring against secondary |

Text passes 4.5:1; focus passes 3:1. Light outlines on dog/hero fills also pass
because the corresponding text contrast already exceeds 4.5:1. The offset separates
focus from coloured action fills. Do not introduce opacity on readable dog labels.
These are token measurements, not a claim that every existing screen has been
migrated or manually checked in a browser.

## Follow-up adoption

- #172: shared hero, metric, dog-card and status components use these semantics.
- Screen tickets: adopt Dnes, role-specific navigation and desktop layout. Route
  destinations are documented here; no placeholder routes were introduced.
- Existing hand-built controls, compact calendar cells and labelled checkbox/radio
  targets still need screen-level checks; the Button floor does not cover those.
- Existing hardcoded feature colours are migration work for their screen tickets.
  New components must use the contract and semantic tokens.

## Temporary dark-mode deferral

On 4 November 2026 the product owner deferred dark mode. The app forces light
mode regardless of stored theme or OS preference. Header and account appearance
controls are hidden; toast notifications follow the forced theme too. Existing
preferences are not deleted. Dark tokens and both-theme contrast checks remain
as foundations for later reactivation. The dark hero in the light design remains.

## Token provenance and retained compatibility

| Category                        | Tokens and intended use                                                                                                                                                                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmed in the new design     | Light background, foreground, card, primary, accent, secondary, muted text and dog-1…6 match the foundations. Hero colours, card/hero/action radii and control dimensions come from the inspected Today/profile/desktop frames.                                                                     |
| Semantic adaptations            | `dog-foreground` provides opaque readable text. `hero-accent` replaces translucent inset fills with a reusable solid surface. Success follows completion chips; warning/info pairs extend system feedback and are implementation choices, not a claim of exact Figma values.                        |
| Existing kit semantics retained | Popover, input, border, ring, destructive and the foreground pairs support existing controls. They remain useful but are not all individually specified by the foundation swatches.                                                                                                                 |
| Compatibility only              | Mono, compact radius aliases and the shadow scale remain for existing components. The unused serif override and Geist Sans import were removed. New headings use Plus Jakarta Sans; shadows are restricted to floating surfaces. Their retention does not introduce an additional visual direction. |
| Deferred                        | Dark palette, including adapted status pairs, stays available for later reactivation. It is currently inaccessible through application appearance controls.                                                                                                                                         |

Do not treat every retained token as a required feature of the new design. Remove
compatibility tokens only after their existing call sites have been migrated.

## Complete redesign foundation coverage

Additional high-fidelity Figma contexts were inspected for Week (114:999),
walkthrough (117:851), training record (117:927), trainer overview (122:1221),
desktop editor (132:1665), sign-in (141:1507), loading/error (222:753) and
irreversible confirmation (221:753). Together with Today, profile and the desktop
overview these cover the recurring foundations across the planned screen families.

The implementation now also supplies error surfaces, overlay, sidebar aliases,
positive hero text, heatmap bands, progress tracks, field/item/sheet radii,
semantic typography, field height, gutters, sidebar/context widths, bottom-bar
height and safe-area spacing. DESIGN.md maps each recurring pattern to concrete
utilities, so screen work can compose the new design without inventing values.

Heatmap intermediate fills are flattened from the desktop overview's translucent
marks on the white card; they do not carry readable text. Status labels and values
remain separate. This distinction preserves the meaning of dog identity colours.

`pnpm design:check` now verifies 78 contrast pairs and minimum control dimensions.
The dedicated CI step runs it even though CI invokes workspace checks separately
rather than calling the root `check-all` script. The app remains light-only.

Foundation coverage does not replace the shared component implementation in #172
or the screen implementation/acceptance checks in #161?164 and #173?175. The
recipes define their common inputs; accessible behaviour and data remain part of
those tickets.
