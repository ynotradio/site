# Legacy Site Testing Plan

Testing plan for the PHP and jQuery code in `/src`. Goals: prevent regressions during migration, serve as a reference for the modern site rebuild.

## Current State

| Area | Status |
|------|--------|
| PHP linting | ✅ PHP_CodeSniffer in CI (`ci.yml` `php-lint` job) |
| PHP unit tests | ❌ No PHPUnit configured |
| JS unit tests | ❌ jQuery scripts not covered by Vitest |
| E2E tests | ✅ Playwright tests exist for Payload collections and legacy site integration |
| Vitest | ✅ Configured for TypeScript (migrations, Payload hooks, components) |

### Codebase Characteristics

- **PHP 7.4** with interfaces + factory pattern for models, MVC-ish controllers
- **jQuery 1.7.1** — global functions, no modules, deprecated APIs (`.live()`)
- Models are DB-coupled (accept `\mysqli` in constructor) with some extractable pure logic
- Controllers mix rendering (echo/include) with business logic — `YearEndPollController` is the cleanest
- JS scripts are tightly DOM-coupled with hardcoded selectors

## Framework Choices

| Layer | Framework | Rationale |
|-------|-----------|-----------|
| PHP unit tests | **PHPUnit 9.x** | Last version supporting PHP 7.4. Industry standard. |
| JS unit tests | **Vitest + jsdom** | Already configured in the project. Future-aligned. |
| Integration / interaction | **Playwright** | Already in use. Handles Auth0 flows, Docker services, DB state. |
| Component stories | **Storybook** | Already configured. For new React components during migration. |

## Scope

### Priority 1: Listener-Facing Features (Complex)

These are the most complex interactive features and migration candidates.

#### Modern Rock Madness (MRM)

30 files across public voting, bracket display, admin tournament management.

**PHP — unit-testable pure logic (extract or test in-place):**

| Method | Location | What It Does |
|--------|----------|-------------|
| `calculateVotePercentage($v1, $v2, $display)` | `SqlModernRockMadness` | Returns formatted percentage string |
| `isMatchTied($match)` | `SqlModernRockMadness` | Compares vote counts |
| `getTournamentYear($startDate)` | `SqlModernRockMadness` | Parses year from date string |
| `getTimelineData($startDate)` | `SqlModernRockMadness` | Calculates round dates from start date |
| `getTournamentDates($startDate)` | `SqlModernRockMadness` | Detailed date math for tournament schedule |
| `getMatchStatus($matchId)` | `SqlModernRockMadness` | Date comparison → 'early', 'running', 'over' |

**PHP — mock-based tests (PHPUnit with mocked `\mysqli`):**

| Target | What to Test |
|--------|-------------|
| `MadnessController::processVote()` | Vote recording, duplicate prevention, Auth0 email handling |
| `MadnessController::getChampionData()` | Champion lookup, tournament-over logic |
| `MadnessAdminController::closeMatch()` | Match closing, winner determination |
| `MadnessAdminController::getTimerOrVs()` | Timer vs. "VS" display logic |

**JS — Vitest with jsdom:**

| Function | File | Testability |
|----------|------|-------------|
| `Madness.displayDiffFormat(diff)` | `countdown.js` | ✅ Testable as-is (pure math) |
| `Madness.startTimer(endtime, timer)` | `countdown.js` | Needs `vi.useFakeTimers()` + minimal DOM |
| `AdminMadness.vote(form)` | `admin_madness.js` | Needs jQuery mock + fetch/XHR mock |

**Playwright — interactive flows:**

| Scenario | Notes |
|----------|-------|
| Vote in active match | Requires Auth0 login, active match in DB, time mocking |
| View bracket display | Visual verification of bracket rendering |
| Admin: close match, advance winner | Multi-step admin workflow |
| Countdown timer behavior | Time-sensitive; use `page.clock` API |

**Recommended refactors (small):**

- Extract `calculateVotePercentage`, `isMatchTied`, `getTournamentYear` into a `MadnessUtils` trait or static helper class so they're testable without DB mocking
- Move `Madness.displayDiffFormat()` to a separate ES module file for clean Vitest import

#### Top 11

~20 model methods, voting form with Auth0, admin operations dashboard.

**PHP — mock-based tests:**

| Target | What to Test |
|--------|-------------|
| `SqlTop11::hasUserVotedThisWeek()` | Duplicate vote prevention per voting period |
| `SqlTop11::getCurrentVotingWeek()` | Voting period identifier generation |
| `_top11_save.php` logic | Vote processing, write-in handling, contestant saving |

**JS — Vitest with jsdom:**

| Function | File | Testability |
|----------|------|-------------|
| Top11 write-in toggle (`#top11_write_in`) | `common_functions.js` | Checkbox enables/disables text field. Needs jQuery + DOM setup. |

**Playwright — interactive flows:**

| Scenario | Notes |
|----------|-------|
| Submit votes for Top 11 songs | Auth0 login, checkbox selection, write-in |
| Duplicate vote prevention | Vote once, try again in same period |
| Admin: pick random winner | Requires seeded contestants |
| Admin: toggle voting status | Open/close voting |

**Recommended refactors (small):**

- Extract vote processing logic from `_top11_save.php` into a testable controller method (currently inline PHP in a partial)

#### Year End Poll / Staff Picks

12 poll categories, contest entry system, staff picks CMS. Cleanest architecture of the three.

**PHP — unit-testable pure logic:**

| Method | Location | What It Does |
|--------|----------|-------------|
| `formatPollHeader($pollName, $category)` | `SqlYearEndPoll` | String formatting |
| `formatPollName($pollName)` | `SqlYearEndPoll` | Display name transformation |
| `getMaxPicks($pollName)` | `SqlYearEndPoll` | Lookup table returning max picks per category |

**PHP — mock-based tests:**

| Target | What to Test |
|--------|-------------|
| `YearEndPollController::processVotes()` | Orchestrates voting across model calls |
| `YearEndPollController::processContestEntry()` | Contest entry with duplicate prevention |
| `YearEndPollController::getPollClass()` | CSS class determination logic |
| `SqlYearEndPoll::canEnterContest()` | IP/email/phone dedup checks |

**JS — Vitest with jsdom:**

| Function | File | Testability |
|----------|------|-------------|
| `errorMessage(numberOfChecked, max)` | `yr_end_poll.js` | ✅ Pure function, testable as-is |
| `enableSubmit()` | `year_end_poll.js` | Checkbox count validation. Needs jQuery + DOM. |
| `formValidator()` | `year_end_poll.js` | Contest form field validation. Needs jQuery + DOM. |
| `otherWatcher()` | `year_end_poll.js` / `yr_end_poll.js` | Write-in toggle (both files have versions). Needs jQuery + DOM. |

**Playwright — interactive flows:**

| Scenario | Notes |
|----------|-------|
| Vote in each poll category | 12 categories with different max picks |
| Submit contest entry | Name, email, phone validation |
| Duplicate contest prevention | Same IP/email/phone blocked |
| View staff picks page | Visual verification |

### Priority 2: Other Complex Listener-Facing Features

#### On Demand (Complex)

Multi-sort interface with pagination and embedded audio players.

**PHP tests:** Pagination math, sort mode switching, display helper output  
**Playwright tests:** Sort by date/artist/text, pagination navigation, audio player rendering

#### Schedule (Moderate)

7-day schedule display with timezone handling.

**PHP tests:** `on_air()` function in `main_fns.php`, time range formatting, "All Day" entry handling  
**Playwright tests:** Schedule page renders correctly, time display formatting

#### Concerts (Moderate)

Event listing with "SOLD OUT" status and ticket links.

**PHP tests:** Upcoming vs. past filtering, sold-out status rendering  
**Playwright tests:** Concert list display, ticket link behavior

### Priority 3: Shared Infrastructure

**PHP — `main_fns.php` utility functions:**

| Function | Testability | Notes |
|----------|-------------|-------|
| `format($text)` | ✅ Pure function | Text formatting with HTML line breaks |
| `on_air()` | Moderate | Uses `ScheduleFactory` — can mock |
| `validate_user()` | ⚠️ SQL injection risk | Needs refactoring before testing; has security vulnerability |
| `open_db()` | Low | Environment-dependent |
| `login_check()` / `logoff()` | Low | Session/cookie manipulation |

**PHP — `FeatureManager`:**

| Method | Testability | Notes |
|--------|-------------|-------|
| `isEnabled($feature)` | ✅ Highly testable | Config lookup, env var checking. No DB needed. |

**JS — `common_functions.js`:**

| Function | Testability | Notes |
|----------|-------------|-------|
| `setDays()` | Moderate | Populates day dropdown based on month/year. Needs DOM. |
| `checkForm()` | Moderate | Concatenates date fields. Needs DOM. |

### Out of Scope

The following CP (control panel) areas are excluded per brief — they're approaching deprecation:

- Ads (`ad_*.php`)
- Stories (`story_*.php`)
- Concerts (`concert_*.php`)
- Deejays (`deejay_*.php`)
- Music (`music_*.php`)
- On Demand (`ondemand_*.php`)
- Schedule (`schedule_*.php`)
- Custom Text (`custom_text_*.php`)
- CD of the Week (`cdotw_*.php`)

## Implementation Plan

### Phase 1: PHP Unit Testing Setup

1. **Add PHPUnit 9.x** to `src/composer.json` as a dev dependency
2. **Create `src/phpunit.xml`** with test configuration pointing to a `src/tests/` directory
3. **Add `php-test` job** to `.github/workflows/ci.yml` alongside the existing `php-lint` job
4. **Create base test case** class with common helpers (DB mock factory, assertion helpers)

```json
// src/composer.json additions
"require-dev": {
    "phpunit/phpunit": "^9.6",
    "squizlabs/php_codesniffer": "^3.7"
}
```

```yaml
# ci.yml addition
php-test:
  name: PHP Unit Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: shivammathur/setup-php@v2
      with:
        php-version: '7.4'
    - run: composer install --no-interaction --prefer-dist
      working-directory: src
    - run: vendor/bin/phpunit
      working-directory: src
```

### Phase 2: Pure Function Tests (Quick Wins)

These require no mocking or refactoring.

**PHP tests to write:**

- `FeatureManager::isEnabled()` — all flag states
- `SqlYearEndPoll::formatPollHeader()` — all poll types
- `SqlYearEndPoll::formatPollName()` — all poll types
- `SqlYearEndPoll::getMaxPicks()` — all poll types
- `SqlModernRockMadness::calculateVotePercentage()` — edge cases (0/0, ties, landslides)
- `SqlModernRockMadness::isMatchTied()` — tied and non-tied matches
- `SqlModernRockMadness::getTournamentYear()` — with/without date arg
- `main_fns.php::format()` — newlines, special chars, empty strings

**JS tests to write:**

- `yr_end_poll.js::errorMessage()` — boundary conditions
- `countdown.js::Madness.displayDiffFormat()` — various time diffs

### Phase 3: Mock-Based PHP Tests

Using PHPUnit mocks of `\mysqli` to test model implementations.

**Test files to create:**

- `src/tests/Models/SqlModernRockMadnessTest.php`
- `src/tests/Models/SqlTop11Test.php`
- `src/tests/Models/SqlYearEndPollTest.php`
- `src/tests/Controllers/MadnessControllerTest.php`
- `src/tests/Controllers/YearEndPollControllerTest.php`

### Phase 4: JS Tests with jsdom

Using Vitest with jsdom (already configured) and jQuery loaded as a dependency.

**Approach:**

1. Create a `src/js/__tests__/` directory (or `test/legacy-js/`)
2. Load jQuery via jsdom `<script>` injection or `importScripts`
3. Set up minimal DOM fixtures for each test
4. Use `vi.useFakeTimers()` for countdown tests

**Test files to create:**

- `test/legacy-js/countdown.test.ts` — `displayDiffFormat`, `startTimer` with fake timers
- `test/legacy-js/year-end-poll.test.ts` — `errorMessage`, `enableSubmit`, form validation
- `test/legacy-js/common-functions.test.ts` — `setDays`, Top11 write-in toggle

**Alternative for heavily DOM-coupled scripts:** If small refactors to extract testable logic aren't feasible, cover these flows with Playwright E2E tests instead.

### Phase 5: Playwright E2E Tests for Interactive Flows

Add to existing `e2e/` test suite.

**Test files to create:**

- `e2e/year-end-poll.spec.ts` — voting flow, contest entry, duplicate prevention
- `e2e/modern-rock-madness.spec.ts` — voting, bracket display, countdown
- `e2e/top11.spec.ts` — voting, write-ins, duplicate prevention

**Date/time mocking strategy:**

- Use Playwright's built-in `page.clock` API for client-side time control
- For server-side PHP `date()` / `time()` calls, use one of:
  - **Option A:** `libfaketime` via Docker Compose environment variables (system-level; affects PHP, MySQL)
  - **Option B:** Inject a test seam in PHP — a `TimeProvider` class that wraps `date()`/`time()` and can be overridden via environment variable
  - **Recommendation:** Option B is more reliable and doesn't require Docker container recreation

### Phase 6: Expand Vitest Coverage Configuration

Update `vitest.config.ts` to include legacy JS test files in coverage reporting:

```typescript
coverage: {
  include: [
    'bin/migrations/shared/**/*.ts',
    'src/js/**/*.js',  // add legacy JS coverage
  ],
}
```

## Testing What Requires Significant Refactoring → Playwright Instead

These areas are too tightly coupled for unit testing without major rewrites. Test with Playwright instead:

| Area | Reason | Playwright Approach |
|------|--------|-------------------|
| `MadnessAdminController::displayMatchesByRound()` | Deeply nested echo + conditional logic | Admin panel E2E test |
| `_top11_save.php` vote processing | Inline PHP in partial, globals, sessions | Vote submission E2E test |
| `main_fns.php::validate_user()` | SQL injection risk + session coupling | Auth flow E2E test |
| `admin_madness.js` AJAX voting | jQuery `.load()` + AJAX POST | Admin voting E2E test |
| `deejay-sort.js` drag-and-drop | jQuery UI Sortable dependency | Playwright drag-and-drop |
| `init.js` date/time pickers | jQuery plugin initialization | Playwright form interaction |

## File Structure

```
src/
├── composer.json          # add phpunit 9.x
├── phpunit.xml            # new
├── tests/                 # new
│   ├── bootstrap.php      # autoloader setup
│   ├── TestCase.php       # base test case with helpers
│   ├── Models/
│   │   ├── SqlModernRockMadnessTest.php
│   │   ├── SqlTop11Test.php
│   │   ├── SqlYearEndPollTest.php
│   │   └── FeatureManagerTest.php
│   ├── Controllers/
│   │   ├── MadnessControllerTest.php
│   │   └── YearEndPollControllerTest.php
│   └── Functions/
│       └── MainFnsTest.php

test/
└── legacy-js/             # new (or src/js/__tests__/)
    ├── countdown.test.ts
    ├── year-end-poll.test.ts
    └── common-functions.test.ts

e2e/
├── year-end-poll.spec.ts  # new
├── modern-rock-madness.spec.ts  # new
└── top11.spec.ts          # new
```

## CI Integration

The `ci.yml` workflow will get one new job:

```yaml
php-test:
  name: PHP Unit Tests
  runs-on: ubuntu-latest
```

The existing `test` job already runs `yarn test:coverage` (Vitest), which will automatically pick up new `test/legacy-js/*.test.ts` files.

The existing `e2e.yml` workflow will automatically pick up new `e2e/*.spec.ts` files.

## Security Notes

During testing implementation, address these discovered issues:

1. **jQuery 1.7.1** — Released 2011, has known XSS vulnerabilities. Upgrading to jQuery 3.x (or eliminating jQuery during migration) should be tracked as a separate work item.
2. **`validate_user()` in `main_fns.php`** — SQL injection vulnerability (uses string interpolation instead of prepared statements). Refactor to prepared statements before writing tests.
3. **`SqlModernRockMadness`** — Mixed use of `mysqli_real_escape_string()` and prepared statements. Standardize on prepared statements.
4. **`SqlYearEndPoll`** — Dynamic table names from user input in poll queries. Validate against allowlist.

## Success Criteria

- [ ] PHPUnit runs in CI alongside PHP_CodeSniffer
- [ ] Pure function tests pass for MRM, Year End Poll, FeatureManager
- [ ] At least one mock-based controller test per priority-1 feature
- [ ] Vitest tests cover `errorMessage()` and `displayDiffFormat()`
- [ ] Playwright E2E tests cover voting flows for all three priority-1 features
- [ ] No new security vulnerabilities introduced
- [ ] Total PHP test count: ~30-40 tests across models, controllers, utilities
- [ ] Total JS test count: ~15-20 tests for legacy jQuery functions
- [ ] Total new E2E test count: ~10-15 scenarios across 3 features
