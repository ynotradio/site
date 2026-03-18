---
name: elegant-ui-design
description: Resources, tools, and agent patterns for crafting elegant UI designs and building them accurately with modern web best practices the way an expert frontend engineer would. Use when creating new UI components, designing layouts, implementing design systems, or whenever an agent needs to produce high-quality, production-ready frontend work that looks polished and professional.
---

# Elegant UI Design

Guidance for producing beautiful, accessible, performant UIs on this Next.js 15 + React 19 stack — from design conception through pixel-perfect implementation.

> **Library choices are the maintainer's decision.** Do not introduce new component libraries, styling libraries, or animation libraries without explicit approval. See `docs/migration/ui-library-options.md` for research. Use what is already in `package.json`.

---

## Before You Write Code: Commit to a Direction

**Don't default — think about what this specific context needs to feel like.** Defaulting produces the same generic result every time.

### Think About Context First

- **What does this UI do?** A dense admin panel has different needs than a public listener site.
- **Who uses it?** Power users want density and efficiency. Casual visitors want guidance and warmth.
- **What's the emotional job?** Trust? Energy? Efficiency? Focus?
- **What would make this feel specific to Y-Not Radio?** Something about the color, density, or rhythm should feel like it belongs here.

### Project Contexts

| Context | Personality | Approach |
|---------|-------------|----------|
| **Payload admin UI** | Precision & Density | Tight spacing, muted palette, data-forward. Users live in this tool. |
| **Listener site (ynotradio.net)** | Boldness & Energy | High contrast, the brand red, generous negative space. Music and radio energy. |

Pick the right personality before touching layout or color. A polished admin UI and an exciting listener site need fundamentally different executions.

---

## Avoid AI Sameness

AI-generated UIs have a recognizable generic feel — polished but interchangeable. Break out of that by making deliberate choices.

| AI default | Why it happens | Do this instead |
|---|---|---|
| Blue/purple gradients | Statistically safest color | Choose an accent that fits the product's emotional job (Y-Not Radio red exists for a reason) |
| Identical border-radius everywhere | `rounded-lg` applied without thought | Pick a radius system and vary by component role: sharp for data tables, softer for interactive cards |
| Uniform card layouts | Same template for every card type | Vary internal layout by content — metric cards, list items, and feature cards should look different from each other |
| White background + subtle shadow cards | The path of least resistance | Commit to a depth strategy that matches the product (see Depth Strategy below) |
| Decorative gradients on hero sections | Looks "modern" without saying anything | If using gradients, make them functional — directing attention or showing hierarchy |
| Symmetric, uniform spacing everywhere | Machine-generated tidiness | Intentional asymmetry creates visual rhythm; unevenly-breathed whitespace reads as human |

**The test:** If you swapped the Y-Not Radio name with a competitor's and the design still worked, it's too generic.

---

## Visual Iteration with Playwright

Use `playwright-browser_*` tools throughout UI work — navigate to Storybook or the running app, take screenshots, compare to reference.

**Design iteration loop:**
1. `playwright-browser_navigate` → open component in Storybook or app
2. `playwright-browser_take_screenshot` → capture current state
3. Visually compare against design reference → identify gaps
4. Edit code → repeat until match

---

## Design Principles

### Visual Hierarchy
Apply in this order of importance:
1. **Size** — Largest element draws the eye first
2. **Color/Contrast** — High contrast = high importance
3. **Spacing** — Generous whitespace separates groups
4. **Weight** — Bold text signals importance
5. **Position** — Top-left to bottom-right reading flow (LTR)

### Spacing Scale
Use the 4px base scale — never invent arbitrary pixel values:

| Name | Size | Use |
|------|------|-----|
| micro | 4px | Icon-to-label gaps |
| tight | 8px | Within a component |
| standard | 12px | Related elements |
| comfortable | 16px | Section padding |
| generous | 24px | Between sections |
| major | 32px | Page-level separation |

**Symmetrical padding:** All four sides must match unless horizontal padding needs more room for content. Never use asymmetric padding without a clear visual reason.

Translate these values into whatever spacing system the codebase uses.

### Color System

**Color carries meaning — use it only to communicate.** Gray builds structure. Color signals status, action, error, and success.

Four-level contrast hierarchy for text and surfaces:
1. **Foreground** — primary content
2. **Secondary** — supporting information
3. **Muted** — placeholder, helper text
4. **Faint** — dividers, backgrounds

Define tokens, not hardcoded values:
```css
:root {
  --color-brand:          #c0392b;   /* Y-Not Radio red */
  --color-surface:        #1a1a1a;
  --color-surface-raised: #242424;
  --color-text-primary:   #f5f5f5;
  --color-text-muted:     #9ca3af;
  --color-border:         rgba(255, 255, 255, 0.1);
}
```
Use the established token names throughout — don't inline color values.

### Typography

Two font families maximum. Establish a scale and work within it:

```
11px / 12px / 13px / 14px (base) / 16px / 18px / 24px / 32px
```

- **Headlines:** 600 weight, -0.02em letter-spacing
- **Body:** 400–500 weight, normal tracking
- **Labels:** 500 weight, slight positive tracking if uppercase
- **Data (numbers, IDs, codes, timestamps):** monospace face; use `font-variant-numeric: tabular-nums` for columns so values align

Don't add new font sizes or weights without a clear visual reason.

### Depth Strategy

**Choose one approach and commit to it.** Mixing strategies produces incoherent visual weight.

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| **Borders-only (flat)** | Dense admin UI, developer tools | Subtle borders, no shadows |
| **Single shadow** | Light lift for interactive cards | `0 1px 3px rgba(0,0,0,.08)` |
| **Layered shadows** | Premium, dimensional surfaces | Multiple shadow layers at low opacity |
| **Surface color shift** | Dark UIs where shadows are invisible | Slightly lighter background tint for raised elements |

A flat interface with perfect spacing reads more polished than a shadow-heavy one with sloppy details.

### Border Radius

Pick a system and commit — don't mix radii freely:
- **Sharp** (2–6px): data tables, admin forms, developer tools
- **Soft** (8–12px): interactive cards, buttons, modals
- **Round** (full): avatar/badge/pill elements only

Never use large radius (16px+) on small elements — it looks proportionally wrong.

---

## Agent Patterns

### Design-to-Code Pattern
When given a design reference (screenshot, description, or design file):
1. **Commit to direction** — identify the right personality (see above) before writing a line
2. **Extract tokens** — identify exact colors, spacing, font sizes from the design
3. **Identify components** — decompose the design into isolated, composable pieces
4. **Build bottom-up** — atoms first (Button, Badge, Avatar) → molecules (Card, ListItem) → organisms (Header, Sidebar)
5. **Visual-diff** — screenshot the result and compare against the reference before declaring done

### Accessibility-First Pattern
For every interactive component, verify:
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`, `<section>`)
- `aria-label` on icon-only buttons
- 4.5:1 contrast ratio for body text, 3:1 for large text (WCAG AA)
- Full keyboard support: Tab, Enter/Space to activate, Escape to close, Arrow keys for lists
- Focus visible — never `outline: none` without a custom focus indicator
- **Never use unstyled native form elements** (`<select>`, `<input type="date">`) in styled UI — they render OS-native controls that cannot be styled consistently; build custom components

### Responsive Design Pattern
Mobile-first, three breakpoints. Test at: **375px** (mobile), **768px** (tablet), **1280px** (desktop).

Use the layout approach already established in the codebase. Typical pattern:
- Stack vertically on mobile, switch to side-by-side at the tablet breakpoint
- Constrain sidebar width; allow content area to fill remaining space
- Ensure text never overflows its container at any viewport

### Animation Pattern
**Motion is communication, not decoration** — every animation needs a reason.

Prefer CSS transitions for simple hover/focus states. Use JS animation only when CSS cannot achieve the effect.

Timing guidelines:
- **150ms** — micro-interactions (button press, toggle, checkbox)
- **200–250ms** — component transitions (dropdown open, panel expand)
- **300–400ms** — page/route transitions
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes
- Stagger list reveals by 50–75ms for a polished feel

Never use spring/bouncy physics, parallax, or animation that serves no purpose.

Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

### Component State Coverage
Every component needs visual states modeled in Storybook:
- Default / empty
- Loading / skeleton
- Populated / success
- Error / validation failure
- Disabled
- Hover / focus (document in story notes)

---

## Anti-Patterns

Never:
- Invent arbitrary pixel values — use the spacing scale
- Inline color values — use token names
- Use asymmetric padding without a clear visual reason
- Apply large border-radius (16px+) to small elements
- Use multiple accent colors
- Mix depth strategies (shadows + borders + tints all at once)
- Use dramatic drop shadows (`0 25px 50px...`)
- Use thick borders (2px+) for decoration
- Use spring/bouncy animations or motion without purpose
- Use unstyled native `<select>` or `<input type="date">` in styled UI

---

## Quality Checklist Before Declaring UI Done

- [ ] Direction committed before coding (personality, depth strategy, radius system)
- [ ] Screenshot compared to design reference (or intentional improvement documented)
- [ ] No layout breaks at 375px, 768px, 1280px
- [ ] Tab through all interactive elements — order makes sense, focus is visible
- [ ] Color contrast verified (use browser DevTools accessibility panel)
- [ ] Loading, error, and empty states exist
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No hardcoded color values or arbitrary spacing — tokens used throughout
- [ ] Storybook story covers all visual states (see `storybook-best-practices` skill)
- [ ] `yarn lint` exits 0

---

## Recommended Reading

| Resource | What It Teaches |
|----------|-----------------|
| [Refactoring UI](https://www.refactoringui.com) | The single best resource on making UI *look* designed, not developer-default |
| [Every Layout](https://every-layout.dev) | Intrinsic CSS layout patterns that adapt without breakpoints |
| [Open UI](https://open-ui.org) | Browser-native UI component standards and baseline behaviors |
| [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) | Accessibility success criteria checklist |
| [Inclusive Components](https://inclusive-components.design) | Deep dives on building common UI patterns accessibly |
