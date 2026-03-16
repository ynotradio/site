# Playwright Best Practices Audit — Recommendations

Audit of our e2e tests against [Playwright's Best Practices](https://playwright.dev/docs/best-practices), with emphasis on **testing user-visible behavior**.

---

## What's Already Good

- **Auth setup project pattern** — single login shared across tests via `storageState`
- **Test isolation** — no shared mutable state, each test creates unique data via `generateUniqueId()`
- **Helper abstraction** — `payload-helpers.ts`, `test-helpers.ts`, `payload-auth.ts` reduce duplication
- **Environment-based URLs** — all base URLs from env vars, no hardcoded hosts
- **Conditional skips** — `test.skip()` for environment-dependent features (poll open/closed) is well-documented
- **Error detection** — PHP error checks, console error tracking with third-party filters

---

## Recommendations

### 1. Replace non-auto-retrying assertions with web-first assertions (~50 instances)

**Priority: High — directly causes flaky tests**

When you extract a value from the DOM and then assert on the variable, Playwright cannot auto-retry the assertion if the DOM hasn't settled yet. Use web-first assertions that retry automatically.

| Pattern | Files | Fix |
|---------|-------|-----|
| `const text = await el.textContent(); expect(text).toContain(...)` | `modern-rock-madness`, `mrm-postgres-fresh`, `mrm-postgres-extended` | `await expect(el).toContainText(...)` |
| `const attr = await el.getAttribute('x'); expect(attr).toBe(...)` | `mrm-postgres-fresh`, `mrm-postgres-extended`, `top11` | `await expect(el).toHaveAttribute('x', ...)` |
| `const count = await els.count(); expect(count).toBe(N)` | `modern-rock-madness`, `mrm-postgres-fresh`, `mrm-postgres-extended`, `top11`, `year-end-poll` | `await expect(els).toHaveCount(N)` |
| `const count = await els.count(); expect(count).toBeGreaterThan(0)` | same files | `await expect(els.first()).toBeVisible()` or `await expect(els).not.toHaveCount(0)` |
| `const html = await el.innerHTML(); expect(html).toContain(...)` | `modern-rock-madness` | `await expect(el).toContainText(...)` or locator-based check |

**Example transformation:**

```typescript
// ❌ Before — no auto-retry
const matchCount = await matchElements.count();
expect(matchCount).toBe(63);

// ✅ After — auto-retries until timeout
await expect(matchElements).toHaveCount(63);
```

```typescript
// ❌ Before — no auto-retry
const status = await matchCard.getAttribute('status');
expect(status).toBe('running');

// ✅ After — auto-retries
await expect(matchCard).toHaveAttribute('status', 'running');
```

```typescript
// ❌ Before — no auto-retry
const timelineContent = await timeline.textContent();
expect(timelineContent).toContain('1st ROUND');

// ✅ After — auto-retries
await expect(timeline).toContainText('1st ROUND');
```

---

### 2. Prefer user-facing locators over CSS selectors (~100 instances)

**Priority: Medium — improves resilience and accessibility alignment**

Playwright recommends locating elements the way users find them: by role, text, label, or placeholder. CSS selectors (`.class`, `#id`, `[attr]`) couple tests to implementation details.

**Where role-based locators can replace CSS selectors:**

| CSS Selector | Better Alternative | Files |
|---|---|---|
| `input[type="checkbox"]` | `page.getByRole('checkbox')` | `top11`, `year-end-poll` |
| `input[type="text"]` | `page.getByRole('textbox')` or `page.getByLabel('...')` | `year-end-poll` |
| `h1`, `h2` | `page.getByRole('heading', { level: 1 })` | `top11`, `show-cloner` |
| `table`, `tbody tr` | `page.getByRole('table')`, `page.getByRole('row')` | `top11` |
| `a[href*="pdf"]` | `page.getByRole('link', { name: /bracket|pdf/i })` | `modern-rock-madness` |
| `button:has-text("Submit")` | `page.getByRole('button', { name: 'Submit' })` | various |
| `img[src*="banner"]` | `page.getByRole('img', { name: /banner/i })` | `modern-rock-madness` |

**Where CSS selectors are acceptable** (custom web components / legacy PHP without ARIA):

| CSS Selector | Reason to Keep | Recommendation |
|---|---|---|
| `#bracket`, `.match`, `.band1`, `.band2`, `.seed` | Legacy PHP custom DOM without ARIA roles | Add `data-testid` to PHP templates, then use `page.getByTestId()` |
| `match-card`, `#region_1`–`#region_5` | Custom elements / legacy markup | Same — add `data-testid` |
| `#hr`, `#min`, `#sec` | Timer display IDs | Consider `getByTestId('timer-hours')` etc. |

**Note:** Some selectors like `[data-theme]` in `payload-basic.spec.ts` are fine — testing a meaningful attribute.

---

### 3. Replace `waitForSelector` with locator-based waits (8 instances)

**Priority: Medium — deprecated API**

`page.waitForSelector()` is a legacy API. Locator-based waits are more robust and integrate with auto-retry.

| File | Current | Replacement |
|---|---|---|
| `payload-helpers.ts` | `await page.waitForSelector('form', { state: 'visible' })` | `await expect(page.locator('form')).toBeVisible()` |
| `payload-helpers.ts` | `await page.waitForSelector('[role="listbox"]', ...)` | `await page.getByRole('listbox').waitFor({ state: 'visible' })` |
| `test-helpers.ts` | `await page.waitForSelector('[role="listbox"]', ...)` | `await page.getByRole('listbox').waitFor({ state: 'visible' })` |
| `cdoftheweek.spec.ts` | 2× `waitForSelector` | Convert to locator `.waitFor()` |
| `djs.spec.ts` | 1× `waitForSelector` | Convert to locator `.waitFor()` |
| `songs.spec.ts` | 1× `waitForSelector` | Convert to locator `.waitFor()` |

---

### 4. Reduce `networkidle` usage (22 instances)

**Priority: Medium — slows tests and can cause flakiness**

`waitUntil: 'networkidle'` waits for 500ms of no network activity. This is fragile with analytics, websockets, or polling. Prefer waiting for a specific visible element instead.

**Biggest offender:** `mrm-payload-admin.spec.ts` (14 instances)

```typescript
// ❌ Before — waits for all network to settle
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

// ✅ After — waits for the specific thing you care about
await page.goto(url);
await expect(page.getByRole('heading', { name: 'Tournaments' })).toBeVisible();
```

**Files to update:**

| File | Count | Suggestion |
|---|---|---|
| `mrm-payload-admin.spec.ts` | 14 | Wait for specific Payload admin elements |
| `crud-integration.spec.ts` | 3 | Wait for page content |
| `show-cloner.spec.ts` | 2 | Wait for "Show Cloner" heading |
| `payload-integration.spec.ts` | 2 | Wait for specific content |
| `payload-helpers.ts` | 3 | Wait for form/UI elements |
| `test-helpers.ts` | 2 | Wait for content ready |
| `payload-auth.ts` | 1 | Wait for login form |

---

### 5. Remove third-party widget assertions (3 tests)

**Priority: Low — tests something we don't control**

Per Playwright best practices: *"Don't test third-party dependencies."* These tests will fail if Twitter/Facebook CDN is slow or blocked:

- `modern-rock-madness.spec.ts` — "should have Twitter widget" (checks for twitter in `innerHTML`)
- `modern-rock-madness.spec.ts` — "should have Facebook like button" (checks for `fb-like` class)

**Options:**
1. **Remove** these tests entirely (Playwright recommendation)
2. **Mock** the third-party scripts via `page.route()` and only verify our code embeds them
3. **Weaken** assertions to just check that the embed container exists, not that the third-party script loaded

---

### 6. Replace `page.evaluate()` with locator assertions (4 instances)

**Priority: Low — works but bypasses Playwright's locator system**

```typescript
// ❌ Before — reaches into window object
const hasMadness = await page.evaluate(() => typeof (window as any).Madness !== 'undefined');
expect(hasMadness).toBe(true);

// ✅ After — test user-visible behavior instead
// If Madness object drives UI (countdown timer), assert the timer renders correctly:
await expect(page.locator('#hr')).toBeVisible();
await expect(page.locator('#min')).toBeVisible();
await expect(page.locator('#sec')).toBeVisible();
```

The `page.evaluate()` calls in `modern-rock-madness.spec.ts` and `mrm-postgres-fresh.spec.ts` test the `window.Madness` JavaScript object directly. This tests implementation, not user-visible behavior. If the timer renders correctly, the JS object is working — no need to test it separately.

---

### 7. Avoid testing implementation details in bracket rendering

**Priority: Low — consider for future refactors**

Several MRM tests assert exact DOM structure (number of `.match` elements per region, exact count of `.seed` elements, etc.). These are implementation details. If the bracket HTML restructures but still displays correctly, these tests break.

**Consider replacing:**
- "bracket should contain exactly 63 match elements" → assert that specific matchups are visible by text
- "region should have 15 match elements" → assert that the region displays expected band names
- "seed count >= 126" → assert specific seeds are visible next to band names

```typescript
// ❌ Testing implementation detail
const matchCount = await page.locator('.match').count();
expect(matchCount).toBe(63);

// ✅ Testing user-visible behavior
await expect(page.getByText('Japanese Breakfast')).toBeVisible();
await expect(page.getByText('Charly Bliss')).toBeVisible();
// ... assert key matchups the user would see
```

---

## Summary by Priority

| # | Recommendation | Instances | Priority | Effort |
|---|---|---|---|---|
| 1 | Web-first assertions (auto-retry) | ~50 | 🔴 High | Medium |
| 2 | User-facing locators over CSS | ~100 | 🟠 Medium | High (some need `data-testid` in PHP) |
| 3 | Replace `waitForSelector` | 8 | 🟠 Medium | Low |
| 4 | Reduce `networkidle` | 22 | 🟠 Medium | Medium |
| 5 | Remove third-party widget tests | 3 | 🟢 Low | Low |
| 6 | Replace `page.evaluate()` | 4 | 🟢 Low | Low |
| 7 | Assert user-visible behavior over DOM structure | ~20 | 🟢 Low | Medium |

### Suggested order of attack

1. **Rec #1** (web-first assertions) — biggest flakiness reducer, mechanical transformation
2. **Rec #3** (waitForSelector) — small scope, quick win
3. **Rec #4** (networkidle) — medium effort, good speed improvement
4. **Rec #2** (user-facing locators) — largest scope, may need PHP template changes for `data-testid`
5. **Rec #5, #6, #7** — lower priority, tackle opportunistically
