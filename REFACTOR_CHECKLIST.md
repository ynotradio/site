# React Component Refactoring Checklist (PR #173 Standards)

Based on complete analysis of all .tsx files in the codebase on branch `copilot/customize-payload-cms-ui`.

## ✅ Already Compliant (3 components)

These components meet all PR #173 requirements:

- [x] `payload/src/features/shared/EmptyState.tsx` (24 lines) ✅ Test ✅ Story
- [x] `payload/src/features/shared/LoadingSpinner.tsx` (37 lines) ✅ Test ✅ Story
- [x] `payload/src/features/shared/RadioToolsNavLinks.tsx` (57 lines) ✅ Test ✅ Story

## 📋 Needs Tests & Stories (11 components)

### High Priority - User-Facing Components (Current Branch)

1. [x] **ThumbnailCell.tsx** (54 lines) ✅ COMPLETED
   - Status: NEW in current branch
   - ✅ Has: Test file + Story file + CSS file
   - Used by: All collections with images (DJs, Artists, Posts, Records, etc.)

2. [x] **CustomDashboard.tsx** (97 lines) ✅ COMPLETED
   - Status: NEW in current branch
   - ✅ Has: Test file + Story file + CSS file
   - Used by: Payload admin dashboard

### Medium Priority - Existing Components with Stories

3. [x] **MusicBrainzArtistField.tsx** (211 lines) ✅ COMPLETED
   - ✅ Has: Test file + Story file
   - Used by: Artists collection

4. [x] **MusicBrainzRecordingField.tsx** (230 lines) ✅ COMPLETED
   - ✅ Has: Test file + Story file
   - Used by: Songs collection

5. [x] **MusicBrainzReleaseField.tsx** (239 lines) ✅ COMPLETED
   - ✅ Has: Test file + Story file
   - Used by: Records collection

### Medium Priority - DJ Order Feature

6. [x] **DJOrderClient.tsx** (240 lines → 192 lines) ✅ COMPLETED
   - ✅ Has: Test file + Story file
   - Used by: DJ Order tool

7. [x] **DJsListHeader.tsx** (40 lines) ✅ COMPLETED
   - ✅ Has: Test file + Story file + CSS file
   - Used by: DJs collection list view

8. [x] **SortableItem.tsx** (59 lines) ✅ COMPLETED
   - ✅ Has: Test file + Story file + CSS file
   - Dynamic transform styles remain (required for DnD)
   - Path: `payload/src/features/dj-order/components/`
   - Used by: DJOrderClient

### Low Priority - Other Components

9. [x] **ShowsListHeader.tsx** (40 lines) ✅ COMPLETED
    - ✅ Has: Test file + Story file + CSS file
    - Used by: Shows collection list view

10. [x] **ShowRow.tsx** (59 lines) ✅ COMPLETED
     - ✅ Has: Test file + Story file + CSS file
     - Path: `payload/src/features/show-cloner/components/`
     - Used by: ShowClonerClient

11. [x] **client.tsx** (54 lines) - Embed feature ✅ COMPLETED
     - ✅ Has: Test file + Story file
     - No inline styles
     - Path: `payload/src/features/embed/`
     - Used by: Post content blocks

### 🚨 CRITICAL - Over 300 Lines

12. [x] **ShowClonerClient.tsx** (606 lines → 126 lines) ✅ REFACTORED
     - Status: ✅ Reduced by 79% (606 → 126 lines)
     - ✅ Extracted hooks: useShows, useShowCloner, useDateRanges
     - ✅ Extracted components: MessageBanner, CloneButton, SourceDateRangeSelector, TargetDateSelector
     - Used by: Show Cloner tool
     - **Completed in**: refactor/thumbnail-cell-tests-20260223 branch

## 🏗️ Infrastructure Files (Do Not Need Tests/Stories)

These are Next.js App Router infrastructure files or simple wrappers, not testable React components:

- `app/(payload)/admin/[[...segments]]/page.tsx` (24 lines) - Payload route wrapper
- `app/(payload)/layout.tsx` (29 lines) - Payload layout wrapper
- `payload/src/features/dj-order/index.tsx` (27 lines) - Server component wrapper
- `payload/src/features/show-cloner/index.tsx` (27 lines) - Server component wrapper

## ✅ New Completions (providers)

- [x] **NavDefaultClosed.tsx** (29 lines) ✅ Test + Story
  - Path: `payload/src/components/providers/`
  - Used by: Payload admin layout to collapse sidebar on first visit

## ✅ New Completions (mrm-bracket / mrm-live)

Components added after the original checklist that now have full test + story coverage:

- [x] **BracketTree.tsx** (125 lines) ✅ Test + Story
  - Path: `payload/src/features/mrm-bracket/`
  - Used by: TournamentBracketTab

- [x] **RematchScheduler.tsx** (91 lines) ✅ Test + Story
  - Path: `payload/src/features/mrm-live/`
  - Used by: MatchControlsPanels / MatchControlsTab

### Still Needs Tests/Stories

- [x] **MatchControlsPanels.tsx** (233 lines) ✅ COMPLETED – Has: Test file + Story file
  - Path: `payload/src/features/mrm-live/`
  - Exports: `NavLinks`, `MatchCardHeader`, `MatchCardBody`, `ActionButtons`, `AdminLinks`
  - Used by: MatchControlsTab

## ✅ New Completions (inline styles → CSS)

Converted inline styles to CSS files across all affected components:

- [x] **RadioToolsNavLinks.tsx** ✅ CSS extracted → `RadioToolsNavLinks.css`
- [x] **EmptyState.tsx** ✅ CSS extracted → `EmptyState.css`
- [x] **LoadingSpinner.tsx** ✅ CSS extracted → `LoadingSpinner.css` (removed `<style>` tag)
- [x] **ShowClonerClient.tsx** ✅ CSS extracted → `ShowClonerClient.css`
- [x] **SourceDateRangeSelector.tsx** ✅ CSS extracted → `SourceDateRangeSelector.css`
- [x] **TargetDateSelector.tsx** ✅ CSS extracted → `TargetDateSelector.css`

## 🎯 Summary Statistics

- **Total TSX files**: 21 (excluding .stories.tsx and .test.tsx)
- **Fully compliant**: 17 (81%) ✅
- **Infrastructure (exempt)**: 4 (19%)
- **Inline styles remaining**: 0 ✅ All extracted to CSS
- **Over 300 lines**: 0 (0%) ✅ FIXED

## 📊 Issues Breakdown

| Issue               | Count | Files Affected        |
| ------------------- | ----- | --------------------- |
| Missing test files  | 0     | ✅ NONE               |
| Missing story files | 0     | ✅ NONE               |
| Over 300 lines      | 0     | ✅ NONE               |
| Inline styles       | 0     | ✅ ALL EXTRACTED      |

## 🔧 Recommended Action Plan

### Phase 1: Critical Fixes ✅ COMPLETED

1. [x] Refactor ShowClonerClient.tsx (606 → 126 lines)
   - ✅ Extract custom hooks (`useShows`, `useShowCloner`, `useDateRanges`)
   - ✅ Split into smaller components (`MessageBanner`, `CloneButton`, `SourceDateRangeSelector`, `TargetDateSelector`)
   - ✅ Reduce complexity by separating concerns

### Phase 2: Remaining Components ✅ COMPLETED

2. [x] Tests + stories for DJsListHeader.tsx (already existed)
3. [x] Tests + stories for SortableItem.tsx (already existed)
4. [x] Tests + stories for client.tsx (embed feature) (already existed)
5. [x] Add tests + stories for ShowClonerClient.tsx refactored components
   - ✅ CloneButton: test + story added
   - ✅ MessageBanner: test + story added
   - ✅ SourceDateRangeSelector: test + story added
   - ✅ TargetDateSelector: test + story added
   - ✅ ShowClonerClient: test + story added

### Phase 3: Validation ✅ COMPLETED

6. [x] Lint passes: `yarn lint` exits 0 (fixed multiple lint errors in ShowClonerClient.tsx and useDateRanges.ts)
7. [x] Playwright E2E test added for Show Cloner tool (`e2e/show-cloner.spec.ts`)
8. [x] Test coverage meets 80% target for show-cloner feature (81.57% statements)

### Phase 4: Inline Styles → CSS ✅ COMPLETED

9. [x] Extracted all inline styles to CSS files across shared and show-cloner components
   - ✅ `RadioToolsNavLinks.css`, `EmptyState.css`, `LoadingSpinner.css`
   - ✅ `ShowClonerClient.css`, `SourceDateRangeSelector.css`, `TargetDateSelector.css`
   - ✅ Updated tests checking inline styles to check CSS classes instead

## 🔧 Recent Refactoring

### Phase 5: Shared Hook Extraction ✅ COMPLETED

- [x] **Extract `useResolveArtistName` hook** ✅
  - Path: `payload/src/components/fields/useResolveArtistName.ts`
  - Removed ~65 lines of identical `resolveArtistName` code from `MusicBrainzRecordingField.tsx` and `MusicBrainzReleaseField.tsx`
  - Added `useResolveArtistName.test.ts` with 17 unit tests covering all resolution paths
  - `MusicBrainzRecordingField` reduced: 291 → 227 lines
  - `MusicBrainzReleaseField` reduced: 294 → 230 lines

## 📝 Notes

- PR #173 established the coding standards
- Current refactoring reduced ShowClonerClient from 606 to 126 lines (79% reduction)
- All show-cloner components now have complete test/story coverage
- Main blocker (ShowClonerClient over 300 lines) is resolved
- All Phases 1-3 complete: refactoring, tests/stories, and validation
