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
| Existing theme switcher                    | Light, dark and system modes retained; dog indices are stable across themes. Series 05 excluded.                 |

All values live in `apps/frontend/src/styles/global.css`; components use semantic
classes. Dark success/warning/info pairs are accessibility adaptations because the
experimental dark screen is outside this ticket. No static Figma image assets are
needed for tokens or the contract.

## Contrast verification

Run `node scripts/check-design-tokens.mjs`. It reads the actual CSS declarations,
merges inherited dark tokens and computes WCAG sRGB contrast without rounding
before assertions. It checks 36 pairs per theme: neutral body/supporting text,
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
