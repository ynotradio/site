# 20. Legacy CSS Modernisation

[Back to Index](./README.md)

**Status:** Planned, the approach to use when the public PHP frontend is replatformed.

## Source

Ana Rodrigues, _Maintaining and Modernising Legacy CSS_ ("Refactoring A Website with Modern CSS Tricks", Pixel Pioneers Bristol 2025).

- Video: https://www.youtube.com/watch?v=-9JUDUrxneg
- Abstract: https://smashingconf.com/freiburg-2025/speakers/ana-rodrigues
- Talk notes: https://ohhelloana.blog/css-refactor-talk/

Thesis: treat an old codebase like a house renovation. You can't knock it all down, so fix what's there without breaking the rest. "CSS is fantastic at failing": an unsupported feature is just ignored, so modern CSS can be layered on top of legacy CSS safely. Don't default to a rebuild. Prioritise, measure improvements, and ship quick wins.

## How it applies here

[Chapter 14](14-frontend-framework-evaluation.md) recommends a new public-site framework and a fresh vanilla CSS + design-tokens stylesheet. This chapter covers the **transition**: the PHP site and the new frontend will both be live for a while, and the legacy CSS should move toward the same tokens instead of being frozen and thrown away all at once.

## Baseline (2026-11-26)

These are the stylesheets loaded by `src/partials/_header.php`, plus `madness.css` on the MRM pages:

| Metric                       | Value                                                   |
| ---------------------------- | ------------------------------------------------------- |
| Files / lines                | 10 / ~3,600 (`typography.css` alone is 1,272)           |
| Unique colour literals       | 102                                                     |
| Unique `font-size` values    | 30                                                      |
| `z-index` values             | 1, 2, 10, 1000, 1001, 10000, auto                       |
| Vendor-prefixed occurrences  | 254                                                     |
| `!important`                 | 22                                                      |
| ID selectors                 | ~10                                                     |
| Custom properties / `@layer` | 0                                                       |
| Media queries                | `max-width: 767px`, `max-width: 959px`, 3× `min-height` |

Dead files, never loaded: `src/style/base.css` (an `@import` copy of the header list), `src/style/style.css` (empty), `src/style/sortable.css`.

Before starting, re-measure with [Project Wallace](https://www.projectwallace.com/) (`@projectwallace/css-analyzer`) and keep that report as the baseline to compare each step against.

## Order of work

Each step is independently shippable and reversible.

1. **Safety net first.** Add Playwright `toHaveScreenshot()` checks for the key public pages (home, concerts, DJs, schedule, MRM, Top 11). Every later step must pass them without visual changes, unless the change is intended.
2. **Demolition.** Delete the three dead stylesheets.
3. **Put legacy in a layer.** Replace the per-file `<link>` loop with one entry stylesheet:
   ```css
   @layer legacy, tokens, components, overrides;
   @import url('grid.css') layer(legacy);
   @import url('typography.css') layer(legacy);
   /* …remaining files… */
   ```
   Anything new goes in a later layer (or unlayered) and beats legacy CSS whatever its specificity, so there are no more specificity fights with old selectors. Watch out: `!important` reverses layer order, so the 22 legacy `!important` declarations will beat new ones. Remove them while working on the step.
4. **Tokens.** Add the `:root` token file from chapter 14 and swap literals for `var(--…)`, starting with the 102 colours and 30 font sizes. Then both frontends share one design language during the transition.
5. **Quick wins.** Remove the vendor prefixes (all Baseline now). Collapse `z-index` to a token scale. Replace ID selectors with classes. Add `text-box-trim` as a progressive enhancement.
6. **Room by room.** When a page moves to the new frontend, its styles move with it in tokenised form and are deleted from the `legacy` layer. Progress is measured by how small the legacy layer gets.

## Out of scope

- Rewriting the legacy CSS ahead of the replatform. Only do work that will carry over (tokens, layers, deletions).
- Restyling. Visual changes belong to the new frontend, not to this cleanup.
