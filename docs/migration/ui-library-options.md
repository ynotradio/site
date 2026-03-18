# UI Library Options

Research and options for the maintainer to evaluate when selecting UI libraries for the Payload admin and public-facing Next.js frontend. No decisions are final yet — this document captures the landscape so choices can be made deliberately.

## Component Primitives

Unstyled accessible primitives give full styling control while handling the hard parts (keyboard interactions, ARIA, focus management). Options:

| Library | Strengths | Notes |
|---------|-----------|-------|
| **Radix UI** | Mature, widely adopted, excellent Radix-based ecosystem (shadcn/ui builds on it) | Per-primitive installs keep bundle lean |
| **React Aria Components** | Adobe's library; most thorough keyboard/ARIA coverage | Higher complexity; good for demanding accessibility requirements |
| **Headless UI** | Simple API, from Tailwind Labs | Smaller scope than Radix; pairs naturally with Tailwind |

**shadcn/ui** is a code-generation layer on top of Radix UI — not a package dependency, just owned source files. Useful for rapid iteration since the generated code is fully editable.

## Styling

| Approach | Strengths | Trade-offs |
|----------|-----------|------------|
| **Tailwind CSS** | Enforces a design system scale; widely understood; pairs with shadcn/ui | Build-time overhead; long class lists can hurt readability |
| **CSS Modules** | Scoped by default; no runtime cost; familiar to any CSS developer | More boilerplate than utility approach |
| **CSS custom properties** | Universal; works with any styling approach for design tokens | Not a full styling system on its own |
| **Vanilla Extract** | Type-safe, zero-runtime, good for design systems | Newer; smaller ecosystem |

A common pattern combining approaches:
```typescript
// clsx + tailwind-merge for safe conditional Tailwind composition
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

## Motion & Animation

| Library | Use case | Notes |
|---------|----------|-------|
| **Framer Motion** | Rich animations, page transitions, shared-layout, gestures | Largest bundle; most features |
| **@formkit/auto-animate** | Drop-in list reorder/enter/exit animations | One-liner; minimal API surface |
| **Motion One** | Lighter alternative to Framer; Web Animations API-based | Smaller bundle |
| **CSS transitions/animations** | Simple hover, focus, state changes | Always prefer when sufficient |

Always respect `prefers-reduced-motion` regardless of library:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Icons

| Library | Notes |
|---------|-------|
| **Lucide React** | Clean, consistent, tree-shakeable; common in Next.js/shadcn ecosystem |
| **Heroicons** | From Tailwind Labs; pairs naturally with Tailwind |
| **Phosphor Icons** | Extensive set, multiple weights for visual emphasis |

## MCP Servers for UI Work

Tools that could improve agent UI workflows once the stack is settled:

### Figma MCP
Reads Figma design files programmatically — extracts exact colors, spacing, typography, and component specs so agents don't guess values.

```bash
npx figma-developer-mcp --figma-api-key=<token>
```

Useful queries:
```
figma_get_file(fileId, nodeId)   → Component specs, tokens, layout rules
figma_get_image(fileId, nodeIds) → Export nodes as images for reference
```

### Context7 MCP
Resolves current library documentation. Useful once library choices are made so agents get accurate API signatures instead of hallucinating outdated ones.

```
use context7 to get docs for: <library> <topic>
```

## Tailwind Type Scale Reference

For reference if Tailwind is selected — a well-calibrated type scale:
```typescript
// tailwind.config.ts
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

## Further Reading

- [Tailwind CSS Docs](https://tailwindcss.com/docs) — utility-first config and design system setup
- [shadcn/ui](https://ui.shadcn.com) — component patterns built on Radix
- [Radix UI Primitives](https://www.radix-ui.com) — accessible primitive APIs and keyboard models
- [Framer Motion](https://www.framer.com/motion/) — animation API and gesture docs
- [Refactoring UI](https://www.refactoringui.com) — the book behind Tailwind; framework-agnostic design principles
