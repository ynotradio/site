# Storybook Rendering Issues - Fixed

## Date: 2026-01-14

## Problems Identified

When Storybook was started, many component stories were failing to render with errors related to:

1. Missing Payload CMS UI component mocks (`Gutter`, `useStepNav`)
2. Lack of validation tooling to catch issues before committing
3. No documented best practices for creating stories

## Solutions Implemented

### 1. Enhanced Payload UI Mocks

**File: `.storybook/mocks/@payloadcms/ui.tsx` (renamed from `.ts`)**

Added missing mocks:

- `Gutter` - Layout wrapper component used in DJOrderClient and ShowClonerClient
- `useStepNav` - Hook for breadcrumb navigation

```typescript
// Mock Gutter component (wraps content with padding)
export const Gutter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div style={{ padding: '0 var(--gutter-h, 25px)' }}>{children}</div>;
};

// Mock useStepNav hook (for breadcrumbs)
export const useStepNav = () => {
  return {
    setStepNav: () => {
      // No-op in Storybook
    },
  };
};
```

**Updated:** `.storybook/main.ts` to reference the new `.tsx` extension

### 2. Created Validation Script

**File: `scripts/validate-stories.mjs`**

Automated script that checks all `.stories.tsx` files for:

- Required story structure (meta export, default export, at least one story)
- Unmocked Payload UI imports
- Missing provider wrappers (DndContext, etc.)
- Unhandled API/fetch calls
- Component import correctness

**Usage:**

```bash
npm run validate-stories
```

**Features:**

- ✅ Validates all 14 existing story files
- ✅ Checks Payload UI mock completeness
- ✅ Provides actionable error messages
- ✅ Exit code 1 on failure (can be used in CI/CD)
- ✅ Color-coded output for readability

### 3. Comprehensive Documentation

**File: `docs/STORYBOOK_GUIDE.md`**

Created detailed guide covering:

- Common issues and solutions
- Testing checklist before committing
- Story file template
- Debugging procedures
- Quick reference table
- Best practices for:
  - Mocking Payload UI components
  - Handling external dependencies (@dnd-kit, etc.)
  - API/fetch mocking
  - CSS imports
  - Provider wrapping

### 4. Package.json Script Addition

Added `validate-stories` script:

```json
{
  "scripts": {
    "validate-stories": "node scripts/validate-stories.mjs"
  }
}
```

## How to Use Going Forward

### Before Committing New Stories:

1. **Run validation:**

   ```bash
   npm run validate-stories
   ```

2. **Start Storybook and test manually:**

   ```bash
   npm run storybook
   ```

   - Navigate to your stories
   - Check for console errors (F12)
   - Test interactivity
   - Verify all variants render

3. **Fix any issues using:**
   - `docs/STORYBOOK_GUIDE.md` - For specific solutions
   - `.storybook/mocks/@payloadcms/ui.tsx` - Add missing mocks here

### When Adding New Payload UI Components:

If your component uses a Payload UI export not yet mocked:

1. Add the mock to `.storybook/mocks/@payloadcms/ui.tsx`:

   ```typescript
   export const YourNewComponent: React.FC<Props> = (props) => {
     return <div>{props.children}</div>;
   };
   ```

2. Add it to `ALLOWED_PAYLOAD_IMPORTS` in `scripts/validate-stories.mjs`

3. Run `npm run validate-stories` to confirm

### Optional: Add to Pre-Commit Hook

For stricter enforcement, add to `.husky/pre-commit`:

```bash
# Validate Storybook stories
npm run validate-stories || {
  echo "❌ Story validation failed. Fix issues before committing."
  echo "See docs/STORYBOOK_GUIDE.md for help."
  exit 1
}
```

## Verification

All 14 existing story files now pass validation:

```
Stories checked: 14
✓ All stories validated successfully!
```

Stories validated:

- ✅ ThumbnailCell.stories.tsx
- ✅ CustomDashboard.stories.tsx
- ✅ MusicBrainzArtistField.stories.tsx
- ✅ MusicBrainzRecordingField.stories.tsx
- ✅ MusicBrainzReleaseField.stories.tsx
- ✅ DJOrderClient.stories.tsx
- ✅ DJsListHeader.stories.tsx
- ✅ SortableItem.stories.tsx
- ✅ client.stories.tsx (EmbedComponent)
- ✅ EmptyState.stories.tsx
- ✅ LoadingSpinner.stories.tsx
- ✅ RadioToolsNavLinks.stories.tsx
- ✅ ShowsListHeader.stories.tsx
- ✅ ShowRow.stories.tsx

## Files Created/Modified

### Created:

1. `docs/STORYBOOK_GUIDE.md` - Comprehensive guide (7KB)
2. `scripts/validate-stories.mjs` - Validation script (8KB)
3. `docs/STORYBOOK_FIXES.md` - This document

### Modified:

1. `.storybook/mocks/@payloadcms/ui.ts` → `.tsx` - Added Gutter and useStepNav mocks
2. `.storybook/main.ts` - Updated alias to use `.tsx` extension
3. `package.json` - Added `validate-stories` script

## Prevention Strategy

This solution prevents future issues through:

1. **Automated Validation** - Catch issues before they reach Storybook
2. **Documentation** - Clear guidance for all common scenarios
3. **Comprehensive Mocks** - All Payload UI dependencies mocked
4. **Developer Workflow** - Easy-to-run validation command

## Testing Recommendations

1. **After this fix, test Storybook manually:**

   ```bash
   npm run storybook
   # Navigate to different stories and verify they render
   ```

2. **Run validation regularly:**

   ```bash
   npm run validate-stories
   ```

3. **When adding new stories:**
   - Use the template in `docs/STORYBOOK_GUIDE.md`
   - Run validation before committing
   - Test in actual Storybook UI

## Future Enhancements

Consider adding:

- `npm run test-storybook` for interaction testing
- Chromatic visual regression testing
- Automated Storybook build check in CI/CD
- ESLint rules for story file structure
- Story coverage reporting (% of components with stories)

## Questions?

See `docs/STORYBOOK_GUIDE.md` for detailed information on:

- Debugging specific errors
- Adding new mocks
- Working with complex components
- Best practices and patterns
