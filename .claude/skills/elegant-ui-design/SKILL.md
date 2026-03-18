---
name: elegant-ui-design
description: Resources, tools, and agent patterns for crafting elegant UI designs and building them accurately with modern web best practices the way an expert frontend engineer would. Use when creating new UI components, designing layouts, implementing design systems, or whenever an agent needs to produce high-quality, production-ready frontend work that looks polished and professional.
---

# Elegant UI Design

Guidance for producing beautiful, accessible, performant UIs on this Next.js 15 + React 19 stack — from design conception through pixel-perfect implementation.

> **Library choices are the maintainer's decision.** Do not introduce new component libraries, styling libraries, or animation libraries without explicit approval. See `docs/migration/ui-library-options.md` for research. Use what is already in `package.json`.

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
Use a consistent scale — never invent arbitrary pixel values. A 4px base works well:
- **4–8px** — tight groupings (icon + label pairings)
- **12–16px** — related elements within a component
- **24px** — distinct sections within a card
- **32–48px** — major page sections

Translate these directly into whatever spacing system the codebase uses.

### Color System
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
Two font families maximum. Work within the type scale the codebase defines — do not add new font sizes or weights without a clear visual reason.

---

## Agent Patterns

### Design-to-Code Pattern
When given a design reference (screenshot, description, or design file):
1. **Extract tokens** — identify exact colors, spacing, font sizes from the design
2. **Identify components** — decompose the design into isolated, composable pieces
3. **Build bottom-up** — atoms first (Button, Badge, Avatar) → molecules (Card, ListItem) → organisms (Header, Sidebar)
4. **Visual-diff** — screenshot the result and compare against the reference before declaring done

### Accessibility-First Pattern
For every interactive component, verify:
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`, `<section>`)
- `aria-label` on icon-only buttons
- 4.5:1 contrast ratio for body text, 3:1 for large text (WCAG AA)
- Full keyboard support: Tab, Enter/Space to activate, Escape to close, Arrow keys for lists
- Focus visible — never `outline: none` without a custom focus indicator

### Responsive Design Pattern
Mobile-first, three breakpoints. Test at: **375px** (mobile), **768px** (tablet), **1280px** (desktop).

Use the layout approach already established in the codebase. Typical pattern:
- Stack vertically on mobile, switch to side-by-side at the tablet breakpoint
- Constrain sidebar width; allow content area to fill remaining space
- Ensure text never overflows its container at any viewport

### Animation Pattern
Prefer CSS transitions for simple hover/focus states. Use JS animation only when CSS cannot achieve the effect.

Always respect `prefers-reduced-motion` — check via CSS media query or the equivalent hook in whatever library is in use:
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

## Quality Checklist Before Declaring UI Done

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
