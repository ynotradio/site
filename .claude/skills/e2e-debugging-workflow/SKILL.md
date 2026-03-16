---
name: e2e-debugging-workflow
description: Workflow for debugging Playwright E2E test failures. Use when E2E tests are failing in CI, when you need to iterate on test selectors, or when you need to verify test changes work correctly before pushing. Provides step-by-step instructions for local verification.
---

# E2E Test Debugging Workflow

**For agents working on Playwright E2E tests: Follow this workflow to debug failing tests locally before pushing changes.**

## TL;DR

```bash
# 1. Start environment
source ~/.nvm/nvm.sh && nvm use 22
docker compose up -d
yarn payload:dev &  # Wait for "ready" message

# 2. Seed data
yarn seed:payload

# 3. Run specific failing test with debug output
yarn playwright test e2e/collections/shows.spec.ts --debug

# 4. Or run headed to see the browser
yarn playwright test e2e/collections/shows.spec.ts --headed
```

## Common Failure Patterns

### 1. Selector Timeouts

**Symptom:**

```
Error: Timeout 30000ms exceeded waiting for locator('#field-note')
```

**Debugging Steps:**

1. Run the test with `--headed` to see the actual page state
2. Open browser DevTools to inspect the actual element IDs/classes
3. Payload CMS often uses:
   - `#field-{fieldName}` for text inputs
   - `label[for="field-{fieldName}"]` for labels
   - `[data-lexical-editor="true"]` for rich text editors (inside a wrapper)
   - `input[id^="react-select"]` for relationship dropdowns

**Common Fixes:**

```typescript
// Rich text fields - find via label, not direct ID
const fieldLabel = page.locator(`label[for="field-${fieldName}"]`);
const fieldWrapper = fieldLabel.locator('..').locator('..');
const richTextField = fieldWrapper.locator('[data-lexical-editor="true"]');

// Relationship fields - type to search
const field = page.locator('#field-artist');
await field.locator('input[id^="react-select"]').click();
await field.locator('input[id^="react-select"]').fill(artistName);
await page.waitForSelector('[role="listbox"]', { state: 'visible' });
```

### 2. Date Picker Issues

**Symptom:**

```
Error: strict mode violation: locator matched 2 elements
```

**Cause:** Date picker regex like `Choose.*3.*2026` matches multiple days (3rd, 13th, 23rd).

**Fix:** Use ordinal suffix matching:

```typescript
function getOrdinalSuffix(day: number): string {
  const j = day % 10,
    k = day % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// In fillPayloadDateField:
const dayRegex = new RegExp(`Choose.*\\b${day}${getOrdinalSuffix(day)}\\b.*${year}`);
```

### 3. PHP Page Verification Failures

**Symptom:**

```
expect(pageContent).toContain(uniqueShowNote)  # Fails even though data was created
```

**Causes:**

1. **Timestamp vs date comparison**: PostgreSQL `timestamp with time zone` vs `date` comparison fails for same-day timestamps after midnight UTC
2. **Feature flags not set**: PHP page needs `?ff=use_postgres_schedule` parameter
3. **Date filter excludes data**: Query uses `date <= CURRENT_DATE` but test data is in the future
4. **Data not committed**: Test didn't wait for save to complete

**Recommendation:** For reliability, test Payload CMS CRUD only:

```typescript
// Instead of checking PHP page:
await test.step('Verify in Payload list', async () => {
  await navigateToPayloadCollection(page, 'shows');
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
```

### 4. Auth Session Issues

**Symptom:**

```
Error: page.goto: net::ERR_CONNECTION_REFUSED
# or
Redirected to login page
```

**Cause:** Auth setup didn't run or session expired.

**Check:**

1. Verify `auth.setup.ts` runs first in `playwright.config.ts`
2. Check `.auth/` directory has session files
3. Ensure `storageState` is configured for test projects

### 5. Stale Listbox Options

**Symptom:**

```
Error: Timeout waiting for getByRole('option')
```

**Cause:** Relationship dropdown is empty (no seeded data) or search didn't match.

**Fix:**

```typescript
// Type to search for specific item
await field.locator('input[id^="react-select"]').fill(uniqueArtistName);
// Wait for filtered results
await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
// Take first matching option
const option = page.getByRole('option').first();
```

## Local Verification Workflow

### Step 1: Start Environment

```bash
# Ensure Node 22
source ~/.nvm/nvm.sh && nvm install 22 && nvm use 22

# Start Docker services
docker compose up -d

# Wait for PostgreSQL
until docker compose exec postgres pg_isready; do sleep 1; done

# Start Payload in background
yarn payload:dev &

# Wait for Payload to be ready
until curl -s http://localhost:3000/admin > /dev/null; do sleep 2; done
```

### Step 2: Seed Test Data

```bash
# Seed Payload with sample data
yarn seed:payload
```

### Step 3: Run Failing Test

```bash
# Debug mode (pauses on failures, shows DevTools)
yarn playwright test e2e/collections/shows.spec.ts --debug

# Headed mode (see the browser)
yarn playwright test e2e/collections/shows.spec.ts --headed

# With trace on failure
yarn playwright test e2e/collections/shows.spec.ts --trace on
```

### Step 4: Iterate on Selectors

When a selector isn't working:

1. **Pause the test:**

   ```typescript
   await page.pause(); // Opens Playwright Inspector
   ```

2. **Inspect with DevTools:**
   - Right-click element → Inspect
   - Copy the actual selector from Elements panel

3. **Test selector in console:**
   ```javascript
   document.querySelector('#field-note');
   document.querySelectorAll('[data-lexical-editor="true"]');
   ```

### Step 5: Verify Fix Works

```bash
# Run the specific test file
yarn playwright test e2e/collections/shows.spec.ts

# Run all collection tests
yarn playwright test e2e/collections/

# Full E2E suite
yarn playwright test
```

### Step 6: Check Screenshots

Test screenshots are saved to `e2e/screenshots/`. Review them to verify:

- Form was filled correctly
- Save completed successfully
- Data appears in collection list

## Best Practices for Reliable Tests

### 1. Focus on Payload CMS, Not PHP

The Payload admin UI is consistent and predictable. The PHP pages have:

- Complex date/time filters
- Feature flag dependencies
- Timezone sensitivities
- Database connection requirements

**Test Payload directly, test PHP integration separately.**

### 2. Use Unique Identifiers

```typescript
const uniqueId = generateUniqueId();
const uniqueName = `E2E Test Artist ${uniqueId}`;
```

This prevents test pollution and makes debugging easier.

### 3. Wait for Operations to Complete

```typescript
// Wait for save
await Promise.race([
  page.waitForURL(`**/${collectionName}/**`, { timeout: 30000 }),
  page.getByText(/saved successfully/i).waitFor({ timeout: 30000 }),
]);
```

### 4. Take Screenshots at Each Step

```typescript
await captureScreenshot(page, testInfo, '01-Form-Filled');
await clickPayloadSave(page);
await captureScreenshot(page, testInfo, '02-After-Save');
```

### 5. Use test.step for Clarity

```typescript
await test.step('Fill artist form', async () => {
  await fillPayloadTextField(page, 'field-name', uniqueArtistName);
  await fillPayloadSlugField(page, uniqueArtistSlug);
});
```

## CI vs Local Differences

| Aspect        | Local             | CI               |
| ------------- | ----------------- | ---------------- |
| Node version  | May vary          | Uses nvm 22      |
| Docker images | Built locally     | Pulled from GHCR |
| Database      | Persistent volume | Fresh each run   |
| Network       | localhost         | Docker network   |
| Timezone      | System TZ         | UTC              |

**Key insight:** If tests pass locally but fail in CI, suspect:

1. Timezone differences (especially date comparisons)
2. Missing seeded data
3. Docker network configuration
4. Race conditions (CI may be slower)

## Getting Help

If stuck after following this workflow:

1. Check CI logs for the actual error message
2. Look for screenshots in test artifacts
3. Search for similar issues in the Playwright docs
4. Ask for help with specific error details

## Related Skills

- **playwright-ci-workflow** — The complete lifecycle for writing tests that pass in CI. Covers Buildkite monitoring, fast feedback loops (pipeline trimming), environment-aware workflows for CLI vs web agents, and adding tests to the CI curated list. **Use that skill for the CI workflow; use this skill for debugging specific test failures.**
- **detecting-agent-environment** — Environment detection utilities (`detect_docker`, `detect_ci`, etc.)
- **agent-automation-infrastructure** — Pre-built Docker images, CI pipeline details
- **testing-pr-changes** — PR verification checklist and proof requirements
