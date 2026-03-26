# 14. Frontend Framework Evaluation

**Purpose:** Evaluate frameworks for the public-facing site redesign (Phase 2).  
**Date:** February 2026  
**Status:** 🔲 Evaluation — no decision made yet

---

## Context

The CMS migration to Payload + PostgreSQL is complete. The legacy PHP site renders server-side HTML from MySQL/Postgres queries. The next phase is a modern, responsive redesign of the public-facing site.

**What we have today:**
- Payload CMS admin running on Next.js 15, deployed to Netlify
- PostgreSQL (Neon) as the single source of truth
- Payload REST + GraphQL APIs available for content delivery
- Cloudinary CDN for media

**What the public site actually does:**
- Displays mostly read-only content (shows, concerts, DJs, stories, music)
- A few interactive features (Modern Rock Madness voting, Year End Poll, Top 11)
- Schedule display, now-playing info
- ~15 distinct page types, low traffic

**Priorities for the new frontend:**
1. **Minimal dependencies** — fewer things to break, less maintenance
2. **Netlify-compatible** — already paying for it
3. **Fast** — both build and runtime
4. **Agent-friendly** — component-driven, clear file conventions, easy to reason about
5. **Evergreen** — built on web standards, not framework churn
6. **Creative CSS** — room for an expressive, custom design

---

## Options Evaluated

| # | Stack | Philosophy |
|---|-------|------------|
| A | [Next.js 15](#a-nextjs-15) | Full-featured React framework (already in use for Payload) |
| B | [Astro](#b-astro) | Content-first, zero-JS-by-default, island architecture |
| C | [11ty + HTMX](#c-11ty--htmx) | Static HTML generator + hypermedia for interactivity |
| D | [Enhance](#d-enhance) | SSR web components with progressive enhancement |
| E | [Lit](#e-lit) | Google's lightweight web components library |
| F | [Stencil](#f-stencil) | Web component compiler with SSG and TypeScript |
| G | [Qwik](#g-qwik) | Resumable framework — near-zero JS until interaction |
| H | [Remix](#h-remix) | Full-stack React framework built on web standards |
| I | [Marko](#i-marko) | HTML-extended template language with fine-grained partial hydration |

---

## A. Next.js 15

**What it is:** React meta-framework with SSR, SSG, API routes, and the App Router.

**Why consider it:** Already deployed for Payload admin. Shared tooling, shared Netlify config, one `node_modules`.

**Netlify:** First-class support via `@netlify/plugin-nextjs`.

**Dependency footprint:** ~250+ transitive deps. React 19, ReactDOM, Next.js core, Webpack/Turbopack.

**CSS approach:** CSS Modules (built-in), or Tailwind, or vanilla CSS with PostCSS. Supports CSS nesting and custom properties natively in modern browsers.

### MRM Example

```
app/
  madness/
    page.tsx              ← Server Component, fetches from Payload API
    components/
      Bracket.tsx         ← Client-rendered bracket visualization
      Bracket.module.css
      MatchCard.tsx       ← Displays two bands + vote button
      MatchCard.module.css
      VoteButton.tsx      ← "use client" — handles form POST
```

```tsx
// app/madness/page.tsx
export default async function MadnessPage() {
  const tournament = await fetch(`${PAYLOAD_URL}/api/mrm-tournaments?where[year][equals]=2026`);
  const { docs } = await tournament.json();
  const currentMatch = docs[0]?.currentMatch;

  return (
    <main>
      <h1>Modern Rock Madness 2026</h1>
      <MatchCard match={currentMatch} />
      <Bracket rounds={docs[0]?.rounds} />
    </main>
  );
}
```

```tsx
// app/madness/components/VoteButton.tsx
'use client';
export function VoteButton({ matchId, bandId }: Props) {
  async function vote() {
    await fetch('/api/mrm-vote', { method: 'POST', body: JSON.stringify({ matchId, bandId }) });
  }
  return <button onClick={vote}>Vote</button>;
}
```

```tsx
// __tests__/MatchCard.test.tsx
test('renders both bands', () => {
  render(<MatchCard match={mockMatch} />);
  expect(screen.getByText('Band A')).toBeInTheDocument();
  expect(screen.getByText('Band B')).toBeInTheDocument();
});
```

**Tradeoffs:**
- ✅ Shared deployment with Payload, familiar tooling, huge ecosystem
- ✅ Strong agent support — Copilot/Claude know React extremely well
- ❌ Heavy runtime (~90kB+ min React+ReactDOM), overkill for read-only pages
- ❌ React upgrade treadmill, framework complexity (App Router, RSC, Suspense boundaries)
- ❌ Most vendor lock-in of any option here

---

## B. Astro

**What it is:** Content-first static site builder. Ships zero JavaScript by default. Interactive "islands" opt-in only where needed. Can use any UI library (React, Svelte, Lit, vanilla) or none at all.

**Why consider it:** Best balance of modern DX and minimal output. `.astro` components are just HTML templates with fenced JS for data fetching. Perfect for a mostly-read-only site that needs a few interactive widgets.

**Netlify:** Official adapter (`@astrojs/netlify`). SSR, SSG, and hybrid modes all supported.

**Dependency footprint:** ~80 transitive deps for a basic project. No UI framework required.

**CSS approach:** Scoped `<style>` blocks in `.astro` files (like Svelte). Supports vanilla CSS, CSS nesting, custom properties, `@layer`. Can also use Tailwind or Open Props if desired. Each component's styles are automatically scoped — no naming collisions.

### MRM Example

```
src/
  pages/
    madness.astro               ← Static page, fetches at build or request time
  components/
    Bracket.astro               ← Pure HTML/CSS component, no JS shipped
    MatchCard.astro             ← Displays two bands
    VoteForm.astro              ← <form> that works without JS
    VoteIsland.tsx              ← Optional: client-side enhanced voting (island)
  layouts/
    Base.astro                  ← Shared shell (nav, footer, <head>)
  styles/
    tokens.css                  ← Design tokens via custom properties
```

```astro
---
// src/pages/madness.astro
import Base from '../layouts/Base.astro';
import Bracket from '../components/Bracket.astro';
import MatchCard from '../components/MatchCard.astro';

const res = await fetch(`${import.meta.env.PAYLOAD_URL}/api/mrm-tournaments?where[year][equals]=2026`);
const { docs } = await res.json();
const tournament = docs[0];
---
<Base title="Modern Rock Madness 2026">
  <h1>Modern Rock Madness 2026</h1>
  <MatchCard match={tournament.currentMatch} />
  <Bracket rounds={tournament.rounds} />
</Base>
```

```astro
---
// src/components/MatchCard.astro
const { match } = Astro.props;
---
<article class="match-card">
  <div class="band">{match.bandA.name}</div>
  <span class="vs">vs</span>
  <div class="band">{match.bandB.name}</div>
  <form method="POST" action="/api/mrm-vote">
    <input type="hidden" name="matchId" value={match.id} />
    <button name="bandId" value={match.bandA.id}>Vote {match.bandA.name}</button>
    <button name="bandId" value={match.bandB.id}>Vote {match.bandB.name}</button>
  </form>
</article>

<style>
  .match-card {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    padding: 2rem;
    border: 2px solid var(--color-accent);
    border-radius: var(--radius-lg);

    .vs {
      font-weight: 700;
      align-self: center;
    }
  }
</style>
```

```ts
// src/components/__tests__/MatchCard.test.ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import MatchCard from '../MatchCard.astro';

test('renders both band names', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(MatchCard, {
    props: { match: { bandA: { name: 'Radiohead', id: '1' }, bandB: { name: 'Muse', id: '2' }, id: '99' } }
  });
  expect(html).toContain('Radiohead');
  expect(html).toContain('Muse');
});
```

**Tradeoffs:**
- ✅ Zero JS shipped for read-only pages — fastest possible output
- ✅ Scoped CSS built-in, great for creative design without naming collisions
- ✅ Islands for interactivity — can use Lit, vanilla JS, or even React for one widget
- ✅ Strong agent support — `.astro` files are essentially HTML with a script preamble
- ✅ Growing ecosystem, active development, good docs
- ⚠️ Astro-specific template syntax (`.astro` files) — not a web standard, but very close to HTML
- ❌ Still a build-tool framework — you depend on the Astro project continuing

---

## C. 11ty + HTMX

**What it is:** Eleventy is a zero-config static site generator. It takes templates (Nunjucks, Liquid, Markdown, JS) and produces plain HTML. HTMX adds interactivity via HTML attributes — no JavaScript authoring required for dynamic behavior like voting or live updates.

**Why consider it:** The most radically simple option. Templates are just HTML with data. HTMX extends HTML itself rather than replacing it. If the web platform is the framework, this is the closest you get.

**Netlify:** 11ty was created by a Netlify employee (Zach Leatherman). First-class support for static deploys. HTMX endpoints served via Netlify Functions.

**Dependency footprint:** ~30 transitive deps for 11ty. HTMX is a single 14kB file (no npm install required — use a CDN or vendor it).

**CSS approach:** Vanilla CSS, linked or inlined. No build step needed — modern CSS (nesting, `:has()`, container queries, `@layer`) works directly. Use a `tokens.css` file for design variables. Optionally add Lightning CSS for minification.

### MRM Example

```
src/
  _includes/
    base.njk                    ← Shared HTML shell
    components/
      match-card.njk            ← Nunjucks partial
      bracket.njk
  madness.njk                   ← Page template
  css/
    tokens.css                  ← Design tokens
    madness.css                 ← Page-specific styles
  _data/
    tournament.js               ← Data file — fetches from Payload at build time
functions/
  mrm-vote.js                  ← Netlify Function for vote POST
```

```njk
{# src/madness.njk #}
---
layout: base.njk
title: Modern Rock Madness 2026
---
<h1>Modern Rock Madness {{ tournament.year }}</h1>

{% include "components/match-card.njk" %}
{% include "components/bracket.njk" %}
```

```njk
{# src/_includes/components/match-card.njk #}
<article class="match-card">
  <div class="band">{{ tournament.currentMatch.bandA.name }}</div>
  <span class="vs">vs</span>
  <div class="band">{{ tournament.currentMatch.bandB.name }}</div>

  {# HTMX-powered voting — no JS to write #}
  <form hx-post="/api/mrm-vote" hx-target="#vote-result" hx-swap="innerHTML">
    <input type="hidden" name="matchId" value="{{ tournament.currentMatch.id }}">
    <button name="bandId" value="{{ tournament.currentMatch.bandA.id }}">
      Vote {{ tournament.currentMatch.bandA.name }}
    </button>
    <button name="bandId" value="{{ tournament.currentMatch.bandB.id }}">
      Vote {{ tournament.currentMatch.bandB.name }}
    </button>
  </form>
  <div id="vote-result"></div>
</article>
```

```js
// src/_data/tournament.js
module.exports = async function() {
  const res = await fetch(`${process.env.PAYLOAD_URL}/api/mrm-tournaments?where[year][equals]=2026`);
  const { docs } = await res.json();
  return docs[0];
};
```

```js
// functions/mrm-vote.js  (Netlify Function)
exports.handler = async (event) => {
  const { matchId, bandId } = JSON.parse(event.body);
  await fetch(`${process.env.PAYLOAD_URL}/api/mrm-votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match: matchId, band: bandId }),
  });
  return { statusCode: 200, body: '<p class="success">Vote recorded!</p>' };
};
```

```js
// test/match-card.test.js
import { renderNjk } from './helpers.js';

test('renders both band names', () => {
  const html = renderNjk('components/match-card.njk', {
    tournament: {
      currentMatch: {
        bandA: { name: 'Radiohead', id: '1' },
        bandB: { name: 'Muse', id: '2' },
        id: '99'
      }
    }
  });
  expect(html).toContain('Radiohead');
  expect(html).toContain('Muse');
});
```

**Tradeoffs:**
- ✅ Fewest dependencies of any option — nearly zero lock-in
- ✅ HTMX voting is just HTML attributes — progressive enhancement by nature
- ✅ Netlify Functions handle the few server-side needs (voting, live data)
- ✅ Plain CSS, no build pipeline — truly evergreen
- ✅ Templates are dead simple for agents to read and generate
- ✅ HTMX is backend-agnostic — works with any server that returns HTML fragments (Node, Java/Quarkus, PHP, Go, Python). If the backend ever changes, the frontend stays the same. See [HTMX + Quarkus](https://htmx.org/server-examples/) for a Java example of this pattern.
- ⚠️ No component scoping — CSS discipline needed (use `@layer`, BEM, or namespace classes)
- ⚠️ Nunjucks templates aren't "components" in the React sense — less composable
- ❌ Less ecosystem for complex UI patterns (bracket visualization would be hand-rolled)
- ❌ HTMX returns HTML fragments — need to think in terms of server-rendered partials

---

## D. Enhance

**What it is:** An HTML-first framework built on web components. Components are authored as pure functions that return HTML strings. They render on the server via SSR and progressively upgrade to Custom Elements in the browser. Built by the Begin/Architect team.

**Why consider it:** The most web-standards-aligned option. Components are actual Custom Elements. No virtual DOM, no framework runtime. What you write is what the browser runs. If the goal is "use the platform," Enhance is the purest expression of that.

**Netlify:** Deployable via Netlify Functions for SSR, or as a static export. The Enhance team primarily targets Begin/AWS, but the output is standard Node.js and works on any serverless platform.

**Dependency footprint:** ~40 transitive deps. No UI framework. The "runtime" is the browser's built-in Custom Elements API.

**CSS approach:** Enhance provides a utility-class system inspired by Tailwind but generated from a JSON config (no PostCSS, no build step). Alternatively, use `<style>` inside component definitions for scoped styles. Supports vanilla CSS, custom properties, and all modern features.

### MRM Example

```
app/
  pages/
    madness.html                ← Page route (convention-based routing)
  elements/
    mrm-bracket.mjs             ← Custom Element definition (SSR + client)
    mrm-match-card.mjs          ← Renders match with vote form
  api/
    mrm-vote.mjs                ← API route for vote POST
  public/
    css/
      tokens.css
```

```js
// app/elements/mrm-match-card.mjs
export default function MrmMatchCard({ html, state }) {
  const { attrs } = state;
  const match = JSON.parse(attrs['match-data'] || '{}');

  return html`
    <article class="match-card">
      <div class="band">${match.bandA?.name}</div>
      <span class="vs">vs</span>
      <div class="band">${match.bandB?.name}</div>

      <form method="POST" action="/api/mrm-vote">
        <input type="hidden" name="matchId" value="${match.id}" />
        <button name="bandId" value="${match.bandA?.id}">Vote ${match.bandA?.name}</button>
        <button name="bandId" value="${match.bandB?.id}">Vote ${match.bandB?.name}</button>
      </form>
    </article>

    <style>
      :host {
        display: block;
      }
      .match-card {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 1rem;
        padding: 2rem;
        border: 2px solid var(--color-accent);
        border-radius: var(--radius-lg);
      }
    </style>
  `;
}
```

```html
<!-- app/pages/madness.html -->
<h1>Modern Rock Madness 2026</h1>
<mrm-match-card match-data="${tournament.currentMatch | json}"></mrm-match-card>
<mrm-bracket rounds="${tournament.rounds | json}"></mrm-bracket>
```

```js
// test/elements/mrm-match-card.test.mjs
import enhance from '@enhance/ssr';
import MrmMatchCard from '../../app/elements/mrm-match-card.mjs';

test('renders both band names', async () => {
  const html = enhance({ elements: { 'mrm-match-card': MrmMatchCard } });
  const result = await html`<mrm-match-card match-data='${JSON.stringify(mockMatch)}'></mrm-match-card>`;
  expect(result).toContain('Radiohead');
  expect(result).toContain('Muse');
});
```

**Tradeoffs:**
- ✅ True web components — components work in any context, no framework needed at runtime
- ✅ SSR by default — fast first paint, progressive enhancement for interactivity
- ✅ Scoped styles via `:host` and Shadow DOM — clean CSS isolation
- ✅ The output IS the platform — maximally evergreen
- ⚠️ Smaller community and ecosystem compared to Astro or Next.js
- ⚠️ Passing complex data via HTML attributes (JSON strings) is awkward
- ⚠️ Agent familiarity is lower — less training data for Copilot/Claude vs React or Astro
- ❌ Begin/Architect deployment is the primary target; Netlify works but isn't the happy path

---

## E. Lit

**What it is:** Google's lightweight library (~5kB) for building web components using standard Custom Elements and Shadow DOM. Components are reactive classes with a declarative template system using tagged template literals. Lit is not a full framework — it's a thin layer over the web components API.

**Why consider it:** Lit components are real web components. They work in any HTML context — drop them into an Astro page, an 11ty template, a plain HTML file, or even the existing PHP site. This makes Lit a strong **complementary** choice: use it for interactive widgets (bracket viewer, vote form) inside any of the other frameworks evaluated here.

**Netlify:** Lit itself doesn't care about hosting — it's a client-side library. For SSG/SSR, pair it with Astro (which has a first-class `@astrojs/lit` integration) or 11ty (via `@lit-labs/ssr`). Deploys to Netlify however the host framework deploys.

**Dependency footprint:** ~15 transitive deps for `lit` itself. As a standalone site framework, you'd pair it with a static site generator, so total deps depend on the host.

**CSS approach:** Shadow DOM scoping by default — styles inside a Lit component cannot leak out or be affected by external CSS. Use `css` tagged templates for component styles, vanilla CSS custom properties for theming across components (custom properties pierce Shadow DOM).

### MRM Example

```
src/
  components/
    mrm-match-card.ts          ← Lit component (Custom Element)
    mrm-bracket.ts
  pages/                        ← (Host framework provides routing)
```

```ts
// src/components/mrm-match-card.ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('mrm-match-card')
export class MrmMatchCard extends LitElement {
  @property({ type: Object }) match = { bandA: {}, bandB: {}, id: '' };

  static styles = css`
    .match-card {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1rem;
      padding: 2rem;
      border: 2px solid var(--color-accent);
      border-radius: var(--radius-lg);
    }
  `;

  async vote(bandId: string) {
    await fetch('/api/mrm-vote', {
      method: 'POST',
      body: JSON.stringify({ matchId: this.match.id, bandId }),
    });
  }

  render() {
    return html`
      <article class="match-card">
        <div class="band">${this.match.bandA.name}</div>
        <span class="vs">vs</span>
        <div class="band">${this.match.bandB.name}</div>
        <button @click=${() => this.vote(this.match.bandA.id)}>Vote ${this.match.bandA.name}</button>
        <button @click=${() => this.vote(this.match.bandB.id)}>Vote ${this.match.bandB.name}</button>
      </article>
    `;
  }
}
```

```ts
// test/mrm-match-card.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import '../src/components/mrm-match-card.js';

test('renders both band names', async () => {
  const el = await fixture(html`
    <mrm-match-card .match=${{ bandA: { name: 'Radiohead', id: '1' }, bandB: { name: 'Muse', id: '2' }, id: '99' }}>
    </mrm-match-card>
  `);
  expect(el.shadowRoot.textContent).to.contain('Radiohead');
  expect(el.shadowRoot.textContent).to.contain('Muse');
});
```

**Tradeoffs:**
- ✅ True web components — portable across any framework or plain HTML
- ✅ Tiny runtime (~5kB), Shadow DOM scoping, reactive properties
- ✅ Can be adopted incrementally — add Lit widgets to any of the other options
- ✅ Backed by Google, mature ecosystem, strong TypeScript support
- ✅ `@open-wc/testing` provides solid testing patterns
- ⚠️ Not a full site framework — needs a host (Astro, 11ty, or manual HTML) for routing and data fetching
- ⚠️ Shadow DOM can make global theming trickier (custom properties help, but it's an extra consideration)
- ❌ SSR support (`@lit-labs/ssr`) is still experimental — works best as a client-side enhancement

---

## F. Stencil

**What it is:** A web component compiler (from the Ionic team) that generates standards-compliant Custom Elements from TypeScript + JSX. Includes a built-in SSG mode (`stencil build --prerender`) that prerenders every route to static HTML. Think of it as "TypeScript components in, web-standard HTML/JS out."

**Why consider it:** Stencil occupies a unique spot — it's a compiler, not a runtime. The output is vanilla Custom Elements that work anywhere. Unlike Lit (a library you ship), Stencil compiles away at build time, producing optimized, lazy-loaded components with no framework runtime in the browser. Its built-in SSG means it can serve as a complete site framework, not just a component library.

**Netlify:** Static output deploys to any CDN. Stencil's `www/` build directory is standard static files. No special adapter needed.

**Dependency footprint:** ~60 transitive deps for `@stencil/core`. The compiled output has zero runtime dependencies.

**CSS approach:** Scoped CSS via Shadow DOM or scoped-CSS mode (no Shadow DOM but styles are scoped via generated class names). Supports CSS custom properties for theming. Each component has a co-located `css` or `scss` file.

### MRM Example

```
src/
  components/
    mrm-match-card/
      mrm-match-card.tsx        ← Component (TypeScript + JSX)
      mrm-match-card.css        ← Scoped styles
    mrm-bracket/
      mrm-bracket.tsx
      mrm-bracket.css
  pages/
    madness.tsx                  ← SSG page route
stencil.config.ts               ← Build config with prerender settings
```

```tsx
// src/components/mrm-match-card/mrm-match-card.tsx
import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'mrm-match-card',
  styleUrl: 'mrm-match-card.css',
  shadow: true,
})
export class MrmMatchCard {
  @Prop() match: { bandA: any; bandB: any; id: string };

  async vote(bandId: string) {
    await fetch('/api/mrm-vote', {
      method: 'POST',
      body: JSON.stringify({ matchId: this.match.id, bandId }),
    });
  }

  render() {
    return (
      <article class="match-card">
        <div class="band">{this.match.bandA.name}</div>
        <span class="vs">vs</span>
        <div class="band">{this.match.bandB.name}</div>
        <button onClick={() => this.vote(this.match.bandA.id)}>Vote {this.match.bandA.name}</button>
        <button onClick={() => this.vote(this.match.bandB.id)}>Vote {this.match.bandB.name}</button>
      </article>
    );
  }
}
```

```ts
// src/components/mrm-match-card/mrm-match-card.spec.ts
import { newSpecPage } from '@stencil/core/testing';
import { MrmMatchCard } from './mrm-match-card';

test('renders both band names', async () => {
  const page = await newSpecPage({
    components: [MrmMatchCard],
    html: `<mrm-match-card></mrm-match-card>`,
  });
  page.rootInstance.match = {
    bandA: { name: 'Radiohead', id: '1' },
    bandB: { name: 'Muse', id: '2' },
    id: '99',
  };
  await page.waitForChanges();
  expect(page.root.shadowRoot.textContent).toContain('Radiohead');
  expect(page.root.shadowRoot.textContent).toContain('Muse');
});
```

**Tradeoffs:**
- ✅ Compiler output is zero-runtime web components — maximally portable
- ✅ Built-in SSG with automatic prerendering — no separate framework needed
- ✅ TypeScript + JSX syntax is familiar to React developers and agents
- ✅ Lazy-loading and bundle optimization built into the compiler
- ✅ Battle-tested (powers the Ionic Framework's component library)
- ⚠️ JSX-in-a-compiler is its own paradigm — not React, not quite standard web components
- ⚠️ Smaller community than Lit for web component development
- ❌ SSG routing and data fetching are less mature than Astro or 11ty — better suited as a component system than a full content site framework
- ❌ The Ionic team's focus is on Stencil-as-compiler-for-design-systems, not Stencil-as-site-framework

---

## G. Qwik

**What it is:** A "resumable" framework from the creator of Angular. Instead of hydrating the entire page on load (like React/Next.js), Qwik serializes the application state into HTML and only loads JavaScript when the user interacts with something. The result: near-zero JavaScript on initial load, even for interactive pages.

**Why consider it:** Qwik's ~1kB loader is the smallest initial JS payload of any framework that supports full interactivity. For a content site where most pages are read-only but a few need voting or forms, Qwik loads as fast as a static HTML site but progressively loads interaction handlers on demand — no islands pattern needed, no explicit opt-in.

**Netlify:** Supported via `qwik-city` (Qwik's meta-framework) with Netlify Edge adapter. SSG, SSR, and hybrid modes available.

**Dependency footprint:** ~90 transitive deps for a Qwik City project. Moderate — more than 11ty, less than Next.js.

**CSS approach:** Scoped CSS via co-located `.css` files or inline `useStyles$()`. Supports vanilla CSS, Tailwind, or any CSS tool. Component styles are automatically scoped.

### MRM Example

```
src/
  routes/
    madness/
      index.tsx                  ← Page component (SSG or SSR)
  components/
    match-card/
      match-card.tsx             ← Qwik component
      match-card.css
```

```tsx
// src/routes/madness/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { MatchCard } from '../../components/match-card/match-card';

export const useTournament = routeLoader$(async () => {
  const res = await fetch(`${process.env.PAYLOAD_URL}/api/mrm-tournaments?where[year][equals]=2026`);
  const { docs } = await res.json();
  return docs[0];
});

export default component$(() => {
  const tournament = useTournament();
  return (
    <main>
      <h1>Modern Rock Madness 2026</h1>
      <MatchCard match={tournament.value.currentMatch} />
    </main>
  );
});
```

```tsx
// src/components/match-card/match-card.tsx
import { component$, $ } from '@builder.io/qwik';

export const MatchCard = component$<{ match: any }>(({ match }) => {
  const vote = $((bandId: string) => {
    fetch('/api/mrm-vote', {
      method: 'POST',
      body: JSON.stringify({ matchId: match.id, bandId }),
    });
  });

  return (
    <article class="match-card">
      <div class="band">{match.bandA.name}</div>
      <span class="vs">vs</span>
      <div class="band">{match.bandB.name}</div>
      <button onClick$={() => vote(match.bandA.id)}>Vote {match.bandA.name}</button>
      <button onClick$={() => vote(match.bandB.id)}>Vote {match.bandB.name}</button>
    </article>
  );
});
```

```ts
// src/components/match-card/match-card.spec.ts
import { createDOM } from '@builder.io/qwik/testing';
import { MatchCard } from './match-card';

test('renders both band names', async () => {
  const { render, screen } = await createDOM();
  await render(
    <MatchCard match={{ bandA: { name: 'Radiohead', id: '1' }, bandB: { name: 'Muse', id: '2' }, id: '99' }} />
  );
  expect(screen.innerHTML).toContain('Radiohead');
  expect(screen.innerHTML).toContain('Muse');
});
```

**Tradeoffs:**
- ✅ ~1kB initial JS — fastest interactive framework; JS loads only on interaction
- ✅ No hydration cost — "resumability" means the page is interactive without replaying component logic
- ✅ JSX syntax familiar to React developers and agents
- ✅ SSG + SSR + hybrid modes, good Netlify support
- ⚠️ `$()` boundaries and serialization rules are a new mental model to learn
- ⚠️ Smaller ecosystem and community than React or Astro — still maturing
- ❌ More framework-specific conventions than Lit or Enhance — moderate vendor lock-in
- ❌ More complex than needed for a site that's mostly static HTML with occasional forms

---

## H. Remix

**What it is:** A full-stack React framework (from the creators of React Router) that emphasizes web standards — `<form>`, `Request`/`Response`, HTTP caching, and progressive enhancement. Remix 2 merged its core features into React Router 7. Remix 3 is in development and decoupling from React entirely, moving toward a framework-agnostic, web-standards-first model.

**Why consider it:** Remix's philosophy — "use the platform" — aligns well with this project's goals. It uses standard `<form>` submissions for mutations (like HTMX), nested routes for efficient data loading, and HTTP caching headers for performance. It's the React framework that feels least like a React framework.

**Netlify:** Official support with both serverless and edge function adapters. Netlify provides starter templates and a Vite plugin for deployment.

**Dependency footprint:** ~200+ transitive deps. Still React-based (React 19, ReactDOM), so the dependency floor is similar to Next.js.

**CSS approach:** Framework-agnostic — supports vanilla CSS, CSS Modules, Tailwind, or any CSS tool. Route-level `links` export for co-located stylesheets. No built-in scoping beyond CSS Modules.

### MRM Example

```
app/
  routes/
    madness.tsx                  ← Route with loader + action
  components/
    MatchCard.tsx                ← Presentational component
    MatchCard.module.css
```

```tsx
// app/routes/madness.tsx
import { useLoaderData, Form } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await fetch(`${process.env.PAYLOAD_URL}/api/mrm-tournaments?where[year][equals]=2026`);
  const { docs } = await res.json();
  return { tournament: docs[0] };
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  await fetch(`${process.env.PAYLOAD_URL}/api/mrm-votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match: form.get('matchId'), band: form.get('bandId') }),
  });
  return { success: true };
}

export default function MadnessPage() {
  const { tournament } = useLoaderData<typeof loader>();
  const match = tournament.currentMatch;

  return (
    <main>
      <h1>Modern Rock Madness 2026</h1>
      <Form method="post">
        <input type="hidden" name="matchId" value={match.id} />
        <div>{match.bandA.name} vs {match.bandB.name}</div>
        <button name="bandId" value={match.bandA.id}>Vote {match.bandA.name}</button>
        <button name="bandId" value={match.bandB.id}>Vote {match.bandB.name}</button>
      </Form>
    </main>
  );
}
```

```tsx
// __tests__/madness.test.tsx
test('renders both bands from loader data', () => {
  render(<MadnessPage />, { hydrationData: { loaderData: { root: {}, 'routes/madness': mockLoaderData } } });
  expect(screen.getByText('Radiohead')).toBeInTheDocument();
  expect(screen.getByText('Muse')).toBeInTheDocument();
});
```

**Tradeoffs:**
- ✅ Web-standards mutations via `<Form>` — progressive enhancement like HTMX, but with React's component model
- ✅ Nested routes + loaders = efficient data fetching with HTTP caching
- ✅ Strong agent support — Copilot/Claude know React and Remix well
- ✅ Good Netlify support with official adapters
- ⚠️ **Remix 3 has fully decoupled from React.** It uses a Preact-based reactivity layer with an imperative `this.update()` model instead of `useState`/`useEffect`. APIs are built around web-standard `Request`/`Response` objects, runnable on any JS runtime (Node, Deno, Bun). There is no migration path from Remix 2 — the team recommends React Router 7 for existing React apps. Remix 3's "AI-ready" architecture and web-standards focus aligns well with this project's goals, but it's a ground-up rewrite with a small ecosystem and community split.
- ❌ **Remix 2 still ships React (~90kB+).** Remix 3 drops React entirely and uses a ~3kB Preact fork, so the runtime weight problem goes away — but Remix 3 is early-stage with no established patterns, limited documentation, and no Storybook/testing ecosystem yet. Evaluating Remix 3 as a separate option would be premature until it stabilizes.
- ❌ ~200+ dependencies — no lighter than Next.js for a content site
- ❌ Overkill for read-only pages — the loader/action pattern shines for data mutations, which this site has very few of

---

## I. Marko

**What it is:** An HTML-extended template language created at eBay and open-sourced in 2014. Marko treats HTML as the primary language and adds just enough syntax for reactivity — state declarations, conditionals, loops, and event handlers — inline with the markup. Almost any valid HTML is valid Marko. The modern compiler (`runtime-tags`) applies **fine-grained partial hydration**: only the DOM nodes that are actually reactive receive JavaScript. Static markup ships as pure HTML with zero client-side code.

**Why consider it:** Marko sits in a unique spot — it's closer to "enhanced HTML" than to a JavaScript framework. If the goal is minimal JS and an HTML-first authoring experience, Marko delivers both more aggressively than Astro (no island boundaries to draw) and more transparently than Qwik (no `$()` serialization rules). The template syntax is minimal enough that an agent or a new contributor who knows HTML can read it without knowing Marko specifically. It's been production-proven at eBay scale for over a decade.

**Netlify:** Static builds deploy as-is to any CDN. SSR requires a Node.js adapter — Netlify Functions or Edge Functions work, but there is no official Netlify adapter (unlike Astro or Qwik). A static-first deployment with server-side forms handled by Netlify Functions is the most straightforward path.

**Dependency footprint:** ~50 transitive deps for a Marko + Vite project (`marko`, `@marko/vite`, `vite`). Compiled output has no runtime framework code for static portions.

**CSS approach:** Scoped `<style>` blocks co-located in `.marko` files, similar to Svelte and Astro. Supports vanilla CSS, custom properties, nesting. No Shadow DOM — styles are scoped via generated class name prefixes at compile time, so global theming and `@layer` work normally.

### MRM Example

```
src/
  pages/
    madness.marko              ← Page template (SSR or SSG)
  components/
    match-card.marko           ← Component file
    bracket.marko
  style/
    tokens.css                 ← Shared design tokens
```

```marko
<!-- src/components/match-card.marko -->
<!-- <let/voting=false> declares a reactive state variable in Marko syntax -->
<let/voting=false>

<article class="match-card">
  <div class="band">${input.match.bandA.name}</div>
  <span class="vs">vs</span>
  <div class="band">${input.match.bandB.name}</div>
  <form>
    <button
      type="button"
      onClick() {
        voting = true;
        await fetch('/api/mrm-vote', {
          method: 'POST',
          body: JSON.stringify({ matchId: input.match.id, bandId: input.match.bandA.id }),
        });
        voting = false;
      }
    >Vote ${input.match.bandA.name}</button>
    <button
      type="button"
      onClick() {
        voting = true;
        await fetch('/api/mrm-vote', {
          method: 'POST',
          body: JSON.stringify({ matchId: input.match.id, bandId: input.match.bandB.id }),
        });
        voting = false;
      }
    >Vote ${input.match.bandB.name}</button>
  </form>
  <if=voting><p class="status">Submitting…</p></if>
</article>

<style>
  .match-card {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    padding: 2rem;
    border: 2px solid var(--color-accent);
    border-radius: var(--radius-lg);

    & .vs {
      font-weight: 700;
      align-self: center;
    }
  }
</style>
```

```marko
<!-- src/pages/madness.marko -->
<await(fetch(`${process.env.PAYLOAD_URL}/api/mrm-tournaments?where[year][equals]=2026`).then(r => r.json()))>
  <@then|{ docs }|>
    <const/tournament=docs[0]>
    <h1>Modern Rock Madness 2026</h1>
    <match-card match=tournament.currentMatch />
    <bracket rounds=tournament.rounds />
  </@then>
</await>
```

```ts
// src/components/__tests__/match-card.test.ts
import { render, screen } from '@marko/testing-library';
import MatchCard from '../match-card.marko';

test('renders both band names', async () => {
  await render(MatchCard, {
    match: { bandA: { name: 'Radiohead', id: '1' }, bandB: { name: 'Muse', id: '2' }, id: '99' },
  });
  expect(screen.getByText('Radiohead')).toBeInTheDocument();
  expect(screen.getByText('Muse')).toBeInTheDocument();
});
```

**Tradeoffs:**
- ✅ Fine-grained partial hydration — only reactive DOM nodes ship JS; static content is pure HTML, no opt-in required
- ✅ HTML-first syntax — `.marko` files look like HTML templates; minimal mental overhead for markup-heavy pages
- ✅ Production-proven at eBay scale (powers eBay.com) — not a hobby project
- ✅ Streaming SSR built-in — fast time-to-first-byte for large content pages
- ✅ Scoped `<style>` without Shadow DOM — global CSS and `@layer` work normally
- ✅ `@marko/testing-library` mirrors Testing Library API — familiar testing model
- ⚠️ Smaller community and ecosystem than React, Astro, or Qwik — fewer third-party components and plugins
- ⚠️ No official Netlify adapter — SSR deployment requires more manual wiring than Astro or Qwik
- ❌ Lower agent familiarity — Marko's syntax and idioms are underrepresented in Copilot/Claude training data compared to React or Astro
- ❌ No Storybook integration — no official adapter exists; component isolation testing requires alternative tooling
- ❌ Relatively small community outside of eBay — ecosystem growth is slower than Astro or Qwik

---

## CSS Strategy (Framework-Independent)

Regardless of framework choice, the CSS approach should lean into modern platform features and minimize tooling:

### Recommended: Vanilla CSS + Design Tokens

```css
/* tokens.css — shared design language */
:root {
  --color-bg: #0a0a0f;
  --color-text: #e8e6e3;
  --color-accent: #ff3e3e;
  --color-accent-glow: oklch(65% 0.25 25 / 0.4);
  --font-display: 'Instrument Sans', system-ui;
  --font-body: system-ui, sans-serif;
  --radius-sm: 4px;
  --radius-lg: 12px;
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
}
```

**Modern CSS features to use freely (baseline 2024+):**
- Nesting (`& .child { }`) — eliminates need for Sass
- Container queries (`@container`) — responsive components, not just viewports
- `:has()` — parent selectors, state-driven styling
- `@layer` — cascade control without specificity wars
- `oklch()` / `color-mix()` — perceptually uniform color manipulation
- `@scope` — component-level style scoping without Shadow DOM
- View Transitions API — page transition animations

**What this replaces:**
- No Sass/SCSS needed (nesting + custom properties cover it)
- No CSS-in-JS (scoped styles or `@scope` handle isolation)
- No Tailwind required (but compatible with all options if you want it)
- No PostCSS required for new projects (optional for minification)

### Creative Design Enablers

A radio station site should feel alive. Modern CSS enables this without JS:

```css
/* Example: glowing accent on hover */
.match-card:has(button:hover) {
  box-shadow: 0 0 30px var(--color-accent-glow);
  transition: box-shadow 0.3s ease;
}

/* Example: responsive grid that adapts to content */
.bracket {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  container-type: inline-size;
}

/* Example: view transition for page navigation */
@view-transition {
  navigation: auto;
}

::view-transition-old(main) {
  animation: fade-out 0.2s ease;
}
```

---

## Vite & Build Tooling

Vite is not a framework — it's a **build tool** (dev server + bundler) that most modern frameworks now use under the hood. It's not scored as a separate option because choosing a framework already determines your build toolchain:

| Framework | Build Tool | Notes |
|-----------|-----------|-------|
| Next.js 15 | Turbopack / Webpack | Migrating toward Turbopack; Vite not used |
| Astro | **Vite** | Core build engine |
| 11ty | None (or Lightning CSS) | No bundler required; optionally add Vite via plugin |
| Enhance | Architect/Begin | Custom build; no Vite |
| Lit | **Vite** (recommended) | Official Vite starter template |
| Stencil | Custom (Rollup-based) | Own compiler; no Vite |
| Qwik | **Vite** | Core build engine (Qwik City) |
| Remix | **Vite** | Migrated to Vite in v2; official Vite plugin |
| Marko | **Vite** | `@marko/vite` plugin; first-class integration |

**What Vite gets us:** Instant HMR during development, fast production builds via Rollup, and native ES module support. For frameworks that use Vite (Astro, Qwik, Lit, Remix), the DX benefit is already baked in — you don't need to think about Vite separately.

For 11ty, Vite is optional and adds complexity that may not be needed for a static site with vanilla CSS. For Next.js and Stencil, Vite isn't part of the picture at all.

**Bottom line:** Vite is a positive signal for the frameworks that use it (fast DX, modern tooling), but it doesn't change the framework-level evaluation. All Vite-powered options already benefit from it in their "Build speed" scores above.

---

## Comparison Matrix

| Criterion | Next.js 15 | Astro | 11ty + HTMX | Enhance | Lit | Stencil | Qwik | Remix | Marko |
|-----------|-----------|-------|-------------|---------|-----|---------|------|-------|-------|
| **JS shipped (read-only page)** | ~90kB+ | 0kB | 0kB (14kB w/ HTMX) | 0kB | ~5kB per component | 0kB (lazy-loads on use) | ~1kB loader | ~90kB+ | 0kB |
| **npm dependencies** | ~250+ | ~80 | ~30 | ~40 | ~15 (+ host) | ~60 | ~90 | ~200+ | ~50 |
| **Build tool** | Turbopack | Vite | None | Custom | Vite | Rollup | Vite | Vite | Vite |
| **Netlify support** | ★★★★★ | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★★☆ (via host) | ★★★★☆ | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| **Build speed** | Moderate | Fast | Fastest | Fast | Fast | Fast | Moderate | Fast | Fast |
| **Agent familiarity** | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ |
| **Component model** | React (JSX) | `.astro` (HTML+) | Templates (Njk) | Web Components | Web Components (Lit) | Web Components (compiled) | Qwik (JSX + `$()`) | React (JSX) | Marko (`.marko`, HTML+) |
| **CSS scoping** | CSS Modules | Built-in `<style>` | Manual | Shadow DOM / `:host` | Shadow DOM | Shadow DOM or scoped | Co-located / scoped | CSS Modules | Built-in `<style>` (class-prefixed) |
| **Interactivity model** | Client components | Islands (opt-in) | HTMX attributes | Progressive enhancement | Reactive properties | Lazy-loaded handlers | Resumable (on-demand) | `<Form>` + loaders | Partial hydration (per-node) |
| **Vendor lock-in** | High (React + Vercel) | Medium (Astro syntax) | Low (standards + HTMX) | Lowest (web components) | Low (web standards) | Low (compiles away) | Medium (Qwik conventions) | High (React) | Medium (Marko syntax) |
| **Evergreen score** | ★★☆☆☆ | ★★★☆☆ | ★★★★☆ | ★★★★★ | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★☆☆ |
| **Creative CSS ceiling** | High | High | High | High | High | High | High | High | High |
| **Ecosystem / plugins** | Massive | Growing | Mature | Small | Moderate | Moderate (Ionic) | Small | Large | Small (eBay-driven) |

### Scoring by stated priority

| Priority | Weight | Next.js | Astro | 11ty+HTMX | Enhance | Lit | Stencil | Qwik | Remix | Marko |
|----------|--------|---------|-------|-----------|---------|-----|---------|------|-------|-------|
| Minimal dependencies | ●●●●● | 2 | 4 | 5 | 5 | 4 | 4 | 3 | 2 | 4 |
| Netlify-compatible | ●●●●○ | 5 | 5 | 5 | 3 | 4 | 4 | 4 | 5 | 3 |
| Fast (runtime) | ●●●●○ | 3 | 5 | 5 | 5 | 4 | 5 | 5 | 3 | 5 |
| Agent-friendly | ●●●○○ | 5 | 4 | 3 | 2 | 3 | 3 | 3 | 4 | 2 |
| Evergreen | ●●●●● | 2 | 3 | 4 | 5 | 5 | 4 | 3 | 2 | 3 |
| Creative CSS | ●●●○○ | 4 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| **Weighted total** | | **79** | **102** | **106** | **100** | **98** | **97** | **87** | **76** | **85** |

*(Weighted total = Σ(score × priority weight). Max possible = 120. Higher is better.)*

---

### Storybook Compatibility

Storybook is used in this project for component development and visual testing. Here's how each framework integrates:

| Framework | Storybook Support | Details |
|-----------|------------------|---------|
| **Next.js** | ★★★★★ Native | `@storybook/nextjs` — first-class. Already configured in this repo. |
| **Astro** | ★★★☆☆ Partial | No support for `.astro` components ([open issue](https://github.com/storybookjs/storybook/issues/18356)). Storybook works for island components (React, Svelte, Lit) embedded in Astro pages. |
| **11ty + HTMX** | ★★☆☆☆ Indirect | 11ty templates (Nunjucks) have no Storybook integration. Pair with Lit components via `@lit-labs/eleventy-plugin-lit` — then use `@storybook/web-components` for those. |
| **Enhance** | ★☆☆☆☆ None | No Storybook integration. Enhance elements are pure functions returning HTML strings — could potentially use `@storybook/server` with a custom renderer, but nothing exists today. |
| **Lit** | ★★★★★ Native | `@storybook/web-components` — first-class. Lit components are standard Custom Elements with full Storybook support. |
| **Stencil** | ★★★★☆ Good | Official `@stencil/storybook-plugin`. Well-documented integration for previewing and testing compiled web components. |
| **Qwik** | ★★☆☆☆ Experimental | No official integration. Qwik components can be wrapped as web components for basic Storybook usage, but `$()` boundaries and resumability don't translate to Storybook's rendering model. |
| **Remix** | ★★★★☆ Good | Uses React components — works with `@storybook/react`. Route loaders/actions aren't testable in Storybook, but UI components are. Remix 3 (non-React) has no Storybook support yet. |
| **Marko** | ★☆☆☆☆ None | No official Storybook adapter. Marko components are compiled `.marko` files with no Storybook renderer. Component isolation testing relies on `@marko/testing-library` (Node.js) rather than a browser-based tool. |

**Key takeaway:** If Storybook is a hard requirement for the component development workflow, **Lit** and **Next.js** have the best support. **Astro** works if interactive components are built with Lit or React islands (Storybook covers the islands, not the `.astro` templates). **11ty + HTMX** would need Lit components for anything that needs Storybook coverage. **Marko** and **Enhance** have no Storybook integration — testing requires Node.js-based rendering tools instead.

---

## Observations

**Astro and 11ty+HTMX score highest** for this specific project. They diverge on philosophy:

- **Astro** gives you a modern, component-driven DX with scoped styles and island interactivity — closest to the "component-driven codebase" the problem statement asks for, while still shipping minimal JS. Its `.astro` syntax is very close to HTML and easy for agents to work with. The island model means you could even use a Lit web component for the bracket visualization and keep everything else as zero-JS templates.

- **11ty + HTMX** is the most radically simple and dependency-free option. It embraces HTML as the application language. The tradeoff is that you lose built-in component scoping and composition patterns — you'll rely more on conventions and discipline than framework guardrails. HTMX's approach to interactivity (server returns HTML fragments) is elegant and fits the "mostly read-only" nature of the site perfectly.

**Lit** scores well and is notable as a **complementary pick** rather than a standalone site framework. Lit components are true web components that can be dropped into Astro islands, 11ty pages, or even the existing PHP site during the transition. If the bracket visualization or vote form needs rich client-side behavior, a Lit component is the most portable way to build it — and it can move with you if you switch site frameworks later.

**Stencil** and **Enhance** both champion web standards but from different angles — Stencil as a compile-away TypeScript component system, Enhance as an SSR-first HTML framework. Both have smaller ecosystems and are better suited for teams with specific design-system needs. For a solo-maintainer content site, the ecosystem tradeoff is harder to justify.

**Qwik** has the most innovative runtime model (resumability), but its ~1kB advantage over Astro's 0kB only matters on pages that need interactivity — and most of this site's pages don't. The `$()` serialization boundaries add a learning curve that doesn't pay off for a mostly-static site.

**Next.js** is the safe choice but carries the most weight for what is fundamentally a content site. It would make sense if the site had complex client-side state, real-time features, or heavy interactivity — but it doesn't.

**Remix** scores similarly to Next.js — it's still React, still ~200+ dependencies, still ~90kB runtime. Its `<Form>`-based mutations are philosophically closer to HTMX and the web platform than Next.js's client components, and Remix 3's direction (decoupling from React entirely) is worth watching. But today, for a mostly-read-only content site, it offers the same React overhead without enough differentiation from Next.js to justify switching.

**Marko** scores between Qwik and Remix — its fine-grained partial hydration is technically impressive (only reactive DOM nodes ship JS, without any island boundaries to draw), and its HTML-extended syntax has minimal cognitive overhead. The production pedigree at eBay is a real credibility signal. The blockers for this project are:

- **Ecosystem size** — small community outside of eBay; fewer third-party components and plugins than Astro or Qwik
- **No official Netlify SSR adapter** — more manual wiring required compared to Astro or Qwik
- **No Storybook integration** — this project relies on Storybook for component development; Marko has no adapter
- **Low agent familiarity** — Copilot and Claude have limited Marko training data, increasing the risk of agent-generated errors

Worth revisiting if the ecosystem matures, but not a frontrunner today.

### A hybrid note

These options are not mutually exclusive with the Payload deployment. Payload runs its own Next.js app at `admin.ynotradio.net`. The public site can be a completely separate project using any of these frameworks, deployed as a separate Netlify site, fetching content from Payload's API. This is already the implied architecture.

---

## Next Steps

1. **Pick one or two to prototype.** Build the concerts page and one interactive feature (MRM voting or Top 11) in the chosen framework(s). A day of prototyping will reveal more than any evaluation document.

2. **Validate Netlify deployment.** Deploy the prototype to a Netlify preview site to confirm build times, function behavior, and CDN caching.

3. **Test with real Payload data.** Connect to the dev Neon database and fetch actual content to validate the data-fetching patterns.

4. **Evaluate agent workflow.** Have an agent build a second page in the prototype to assess how well the framework supports AI-assisted development.
