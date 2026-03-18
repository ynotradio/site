---
name: elegant-ui-design
description: Resources, tools, MCP servers, plugins, and subagent patterns for crafting elegant UI designs and building them accurately with modern web best practices the way an expert frontend engineer would. Use when creating new UI components, designing layouts, implementing design systems, choosing UI libraries, or whenever an agent needs to produce high-quality, production-ready frontend work that looks polished and professional.
---

# Elegant UI Design

Guidance for producing beautiful, accessible, performant UIs on this Next.js 15 + React 19 stack — from design conception through pixel-perfect implementation.

## MCP Servers

### Figma MCP
Reads Figma design files programmatically. Extracts exact colors, spacing, typography, and component specs — no guessing from screenshots.

Install in the workspace when designs exist in Figma:
```bash
npx figma-developer-mcp --figma-api-key=<token>
```

Typical queries once connected:
```
figma_get_file(fileId, nodeId)   → Component specs, tokens, layout rules
figma_get_image(fileId, nodeIds) → Export nodes as images for reference
```

**Workflow**: Use Figma MCP to extract design tokens (colors, spacing, type scale) *before* writing CSS. Never invent values that exist in a design file.

### Playwright Browser MCP (already available)
Use `playwright-browser_*` tools for visual design iteration — navigate to Storybook or the running app, take screenshots, compare to reference.

**Design iteration loop:**
1. `playwright-browser_navigate` → open component in Storybook or app
2. `playwright-browser_take_screenshot` → capture current state
3. Visually compare against design reference → identify gaps
4. Edit code → repeat until match

### Context7 MCP (documentation lookup)
Resolves current docs for any library. Use it instead of guessing API signatures.
```
use context7 to get docs for: tailwindcss v4 gradient syntax
use context7 to get docs for: framer-motion AnimatePresence exit animations
use context7 to get docs for: radix-ui Dialog accessibility props
```

---

## UI Library Ecosystem

### Component Primitives

| Library | Role | Install |
|---------|------|---------|
| **shadcn/ui** | Pre-styled Radix components; generates owned source files | `npx shadcn@latest add button` |
| **Radix UI** | Accessible, unstyled primitives (Dialog, Tooltip, Select…) | `yarn add @radix-ui/react-dialog` |
| **React Aria Components** | Adobe's fully accessible primitives; most complete keyboard/ARIA support | `yarn add react-aria-components` |
| **Headless UI** | Tailwind Labs' unstyled accessible components | `yarn add @headlessui/react` |

**Preference**: Use **shadcn/ui** for rapid iteration — it generates source files you own. Use **Radix UI** primitives for custom-styled components that need robust accessibility.

### Styling

| Tool | Use case |
|------|----------|
| **Tailwind CSS** | Utility-first; enforces the spacing/type scale |
| **CSS Modules** | Scoped styles when Tailwind class lists grow unwieldy |
| **CSS custom properties** | Design tokens (colors, spacing, radii) |
| **clsx + tailwind-merge** | Safe conditional class composition |

```typescript
// Standard cn() helper — add to lib/utils.ts if not present
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

### Motion & Animation

| Library | Role |
|---------|------|
| **Framer Motion** | Page transitions, shared-layout animations, gestures |
| **@formkit/auto-animate** | Drop-in list/reorder animations with one line |
| **CSS transitions** | Simple hover/focus states — prefer over JS when possible |

Always respect `prefers-reduced-motion`:
```typescript
import { useReducedMotion } from 'framer-motion';
const prefersReduced = useReducedMotion();
```

### Icons

| Library | Notes |
|---------|-------|
| **Lucide React** | Clean, consistent, tree-shakeable; already common in Next.js ecosystem |
| **Heroicons** | Pairs naturally with Tailwind; from Tailwind Labs |
| **Phosphor Icons** | Extensive set, multiple weights for emphasis |

---

## Design Principles for Agents

### Visual Hierarchy
Apply in this order of importance:
1. **Size** — Largest element draws the eye first
2. **Color/Contrast** — High contrast = high importance
3. **Spacing** — Generous whitespace separates groups
4. **Weight** — Bold text signals importance
5. **Position** — Top-left to bottom-right reading flow (LTR)

### Spacing Scale
Use a consistent scale. Tailwind's 4px base (1 unit = 0.25rem):
- `gap-1` / `gap-2` (4px/8px) — tight groupings (icon + label)
- `gap-3` / `gap-4` (12px/16px) — related elements within a component
- `gap-6` (24px) — distinct sections within a card
- `gap-8` / `gap-12` (32px/48px) — major page sections

Never invent arbitrary pixel values. Stick to the scale.

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
Register tokens in `tailwind.config.ts` under `extend.colors` so utility classes work.

### Typography
Two font families maximum. Define a type scale in Tailwind config:
```typescript
fontSize: {
  xs:   ['0.75rem',  { lineHeight: '1rem' }],
  sm:   ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem',     { lineHeight: '1.5rem' }],
  lg:   ['1.125rem', { lineHeight: '1.75rem' }],
  xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
  '2xl':['1.5rem',   { lineHeight: '2rem' }],
  '3xl':['1.875rem', { lineHeight: '2.25rem' }],
}
```

---

## Agent Subagent Patterns

### Design-to-Code Pattern
When given a design reference (screenshot, Figma link, written description):
1. **Extract tokens** — list exact colors, spacing, font sizes from the design
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
Mobile-first, three breakpoints:
```typescript
// Tailwind mobile-first breakpoints
// sm: 640px  md: 768px  lg: 1024px  xl: 1280px

<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-64 shrink-0">...</aside>
  <main className="min-w-0 flex-1">...</main>
</div>
```
Test at: **375px** (mobile), **768px** (tablet), **1280px** (desktop).

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
- [ ] No hardcoded pixel values — spacing scale used throughout
- [ ] Storybook story covers all visual states (see `storybook-best-practices` skill)
- [ ] `yarn lint` exits 0

---

## Recommended Reading

| Resource | What It Teaches |
|----------|-----------------|
| [Refactoring UI](https://www.refactoringui.com) | The single best resource on making UI *look* designed, not developer-default |
| [Every Layout](https://every-layout.dev) | Intrinsic CSS layout patterns that adapt without breakpoints |
| [Open UI](https://open-ui.org) | Browser-native UI component standards and baseline behaviors |
| [Tailwind CSS Docs](https://tailwindcss.com/docs) | Utility reference and design-system configuration |
| [shadcn/ui](https://ui.shadcn.com) | Component patterns and composition examples |
| [Radix UI Primitives](https://www.radix-ui.com) | Accessible primitive APIs and keyboard interaction models |
| [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) | Accessibility success criteria checklist |
| [Framer Motion](https://www.framer.com/motion/) | Animation API and gesture documentation |
| [Inclusive Components](https://inclusive-components.design) | Deep dives on building common UI patterns accessibly |
