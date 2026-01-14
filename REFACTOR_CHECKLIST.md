# React Component Refactoring Checklist (PR #173 Standards)

Based on complete analysis of all .tsx files in the codebase on branch `copilot/customize-payload-cms-ui`.

## ✅ Already Compliant (3 components)

These components meet all PR #173 requirements:

- [x] `payload/src/features/shared/EmptyState.tsx` (24 lines) ✅ Test ✅ Story
- [x] `payload/src/features/shared/LoadingSpinner.tsx` (37 lines) ✅ Test ✅ Story
- [x] `payload/src/features/shared/RadioToolsNavLinks.tsx` (57 lines) ✅ Test ✅ Story

## 📋 Needs Tests & Stories (11 components)

### High Priority - User-Facing Components (Current Branch)

1. [ ] **ThumbnailCell.tsx** (54 lines)
   - Status: NEW in current branch
   - Missing: Test file + Story file
   - Issues: Inline styles (need CSS file)
   - Used by: All collections with images (DJs, Artists, Posts, Records, etc.)

2. [ ] **CustomDashboard.tsx** (97 lines)
   - Status: NEW in current branch
   - Missing: Test file + Story file
   - Has CSS file: ✅ CustomDashboard.css
   - Used by: Payload admin dashboard

### Medium Priority - Existing Components with Stories

3. [ ] **MusicBrainzArtistField.tsx** (211 lines)
   - Missing: Test file (has story ✅)
   - Issues: Inline styles
   - Used by: Artists collection

4. [ ] **MusicBrainzRecordingField.tsx** (230 lines)
   - Missing: Test file (has story ✅)
   - Issues: Inline styles
   - Used by: Songs collection

5. [ ] **MusicBrainzReleaseField.tsx** (239 lines)
   - Missing: Test file (has story ✅)
   - Issues: Inline styles
   - Used by: Records collection

### Medium Priority - DJ Order Feature

6. [ ] **DJOrderClient.tsx** (240 lines)
   - Missing: Test file + Story file
   - Issues: Inline styles
   - Used by: DJ Order tool

7. [ ] **DJsListHeader.tsx** (40 lines)
   - Missing: Test file + Story file
   - Issues: Inline styles
   - Used by: DJs collection list view

8. [ ] **SortableItem.tsx** (59 lines)
   - Missing: Test file + Story file
   - Issues: Inline styles
   - Path: `payload/src/features/dj-order/components/`
   - Used by: DJOrderClient

### Low Priority - Other Components

9. [ ] **ShowsListHeader.tsx** (40 lines)
   - Missing: Test file + Story file
   - Issues: Inline styles
   - Used by: Shows collection list view

10. [ ] **ShowRow.tsx** (59 lines)
    - Missing: Test file + Story file
    - Issues: Inline styles
    - Path: `payload/src/features/show-cloner/components/`
    - Used by: ShowClonerClient

11. [ ] **client.tsx** (54 lines) - Embed feature
    - Missing: Test file + Story file
    - Issues: Inline styles
    - Path: `payload/src/features/embed/`
    - Used by: Post content blocks

### 🚨 CRITICAL - Over 300 Lines

12. [ ] **ShowClonerClient.tsx** (606 lines) 🚨
    - Status: VIOLATES 300-line limit (202% over)
    - Missing: Test file + Story file
    - Issues: Inline styles, mixed concerns
    - **MUST refactor**: Extract hooks, split into smaller components
    - Used by: Show Cloner tool
    - **Note**: This was already refactored in PR #174, but that's a different branch

## 🏗️ Infrastructure Files (Do Not Need Tests/Stories)

These are Next.js App Router infrastructure files or simple wrappers, not testable React components:

- `app/(payload)/admin/[[...segments]]/page.tsx` (24 lines) - Payload route wrapper
- `app/(payload)/layout.tsx` (29 lines) - Payload layout wrapper
- `payload/src/features/dj-order/index.tsx` (27 lines) - Server component wrapper
- `payload/src/features/show-cloner/index.tsx` (27 lines) - Server component wrapper

## 🎯 Summary Statistics

- **Total TSX files**: 20 (excluding .stories.tsx and .test.tsx)
- **Fully compliant**: 3 (15%)
- **Need tests/stories**: 12 (60%)
- **Infrastructure (exempt)**: 4 (20%)
- **Over 300 lines**: 1 (5%) 🚨

## 📊 Issues Breakdown

| Issue               | Count | Files Affected                             |
| ------------------- | ----- | ------------------------------------------ |
| Missing test files  | 14    | All except 3 shared components             |
| Missing story files | 11    | All except 3 shared + 3 MusicBrainz fields |
| Inline styles       | 11    | Most components                            |
| Over 300 lines      | 1     | ShowClonerClient.tsx                       |

## 🔧 Recommended Action Plan

### Phase 1: Critical Fixes (This Branch)

1. [ ] Refactor ShowClonerClient.tsx (606 → <300 lines)
   - Extract custom hooks (`useShows`, `useShowCloner`)
   - Split into smaller components (`SourceDateRangeSelector`, `TargetDateSelector`)
   - Move date utilities to separate file (`date-helpers.ts`)
   - **Note**: Reference PR #174 for the refactoring pattern

### Phase 2: New Components (This Branch - High Priority)

2. [ ] Add tests + stories for ThumbnailCell.tsx
3. [ ] Add tests + stories for CustomDashboard.tsx
4. [ ] Extract inline styles from ThumbnailCell.tsx to CSS file (`ThumbnailCell.css`)

### Phase 3: Existing Components (Medium Priority)

5. [ ] Add tests for 3 MusicBrainz fields (already have stories)
   - MusicBrainzArtistField.test.tsx
   - MusicBrainzRecordingField.test.tsx
   - MusicBrainzReleaseField.test.tsx
6. [ ] Add tests + stories for DJ Order components
   - DJOrderClient: test + story
   - DJsListHeader: test + story
   - SortableItem: test + story
7. [ ] Add tests + stories for Show Cloner components (after refactor)
   - ShowClonerClient: test + story
   - ShowsListHeader: test + story
   - ShowRow: test + story
8. [ ] Extract inline styles to CSS files across all components

### Phase 4: Validation

9. [ ] Run pre-commit hooks: `yarn lint-staged`
10. [ ] Test with Playwright to verify all functionality
    - [ ] Custom dashboard navigation
    - [ ] Thumbnail cells in list views
    - [ ] DJ Order tool
    - [ ] Show Cloner tool
    - [ ] MusicBrainz fields in forms
11. [ ] Ensure 80% test coverage target

## 📝 Notes

- PR #173 established the coding standards
- PR #174 already refactored several components on a different branch
- Current branch: `copilot/customize-payload-cms-ui`
- This checklist focuses on components in the current branch that need work
- Priority should be given to new components (ThumbnailCell, CustomDashboard) since they're part of this PR
