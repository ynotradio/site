# Storybook Best Practices & Troubleshooting Guide

## Overview

This guide ensures all Storybook stories render properly and helps prevent common issues.

## Common Issues & Solutions

### 1. Missing Payload CMS UI Mocks

**Problem:** Components using `@payloadcms/ui` fail to render in Storybook.

**Solution:** All Payload UI exports are mocked in `.storybook/mocks/@payloadcms/ui.tsx`.

**Currently Mocked:**

- `useField` - For field value management
- `useFormFields` - For accessing form data
- `Gutter` - Layout wrapper component
- `useStepNav` - For breadcrumb navigation

**Adding New Mocks:**

When you use a new Payload UI component/hook:

```typescript
// .storybook/mocks/@payloadcms/ui.tsx
export const YourNewComponent: React.FC<Props> = ({ children }) => {
  return <div>{children}</div>;
};

export const useYourNewHook = () => {
  return {
    // Mock return values
  };
};
```

### 2. External Library Dependencies

**Problem:** Libraries like `@dnd-kit/core` need proper context providers.

**Solution:** Wrap stories with required providers in decorators:

```typescript
// Good example: SortableItem.stories.tsx
decorators: [
  (Story, context) => (
    <DndContext>
      <SortableContext items={[context.args.id]} strategy={verticalListSortingStrategy}>
        <Story />
      </SortableContext>
    </DndContext>
  ),
],
```

### 3. API/Fetch Mocking

**Problem:** Components that fetch data fail in Storybook.

**Solution:** Mock fetch responses in story parameters or use MSW (Mock Service Worker).

**For DJOrderClient:**

```typescript
// Use decorator to mock fetch
decorators: [
  (Story) => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [...] }),
    });
    return <Story />;
  },
],
```

**Better: Use MSW addon** (recommended for complex APIs)

### 4. CSS Module Imports

**Problem:** CSS files not loading in Storybook.

**Solution:** Vite handles CSS imports automatically. Ensure import paths are correct:

```typescript
// Component file
import './Component.css'; // ✅ Correct - relative path

// NOT
import '@/path/to/Component.css'; // ❌ May fail in Storybook
```

### 5. Shared Component Dependencies

**Problem:** Stories reference shared components that don't work in isolation.

**Solution:** Mock shared components or ensure they're Storybook-compatible:

```typescript
// If LoadingSpinner or EmptyState fail, mock them:
// .storybook/preview.tsx
import { fn } from '@storybook/test';

// Mock at preview level for all stories
export const parameters = {
  mockAddonConfigs: {
    globalMock: {
      LoadingSpinner: fn(() => <div>Loading...</div>),
    }
  }
};
```

## Testing Stories Locally

### Manual Testing Checklist

Before committing new stories:

1. **Start Storybook:**

   ```bash
   npm run storybook
   ```

2. **Check Each Story:**
   - Navigate to your new story in the sidebar
   - Verify it renders without errors
   - Check browser console for errors (F12)
   - Test interactive elements (buttons, inputs)
   - Verify different story variants (Default, Empty, Error states)

3. **Check Controls:**
   - Try changing props via Controls panel
   - Ensure component updates correctly

4. **Accessibility:**
   - Open Accessibility tab
   - Fix any violations (especially color contrast, missing labels)

### Automated Story Testing

**Run Storybook tests:**

```bash
npm run test-storybook
```

This runs interaction tests and catches rendering errors.

## Pre-Commit Checklist for Stories

When adding new stories, ensure:

- [ ] Story file matches component name: `Component.stories.tsx`
- [ ] All Payload UI dependencies are mocked
- [ ] External providers (DndContext, etc.) are included in decorators
- [ ] API calls are mocked
- [ ] CSS files are imported correctly
- [ ] At least 2 stories (Default + one variant)
- [ ] Stories render without console errors
- [ ] Story documentation is included in meta.parameters.docs

## Story File Template

Use this template for new stories:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from './YourComponent';

const meta = {
  title: 'Category/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'padded', // or 'centered', 'fullscreen'
    docs: {
      description: {
        component: 'Brief description of what this component does.',
      },
    },
  },
  tags: ['autodocs'],
  // Add decorators if needed (providers, mocks)
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default/primary story
export const Default: Story = {
  args: {
    // Default props
  },
};

// Variant stories
export const WithError: Story = {
  args: {
    error: 'Something went wrong',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
```

## Debugging Failed Stories

### Step 1: Check Browser Console

Open DevTools (F12) and look for:

- `Cannot read property 'X' of undefined` → Missing mock
- `Module not found` → Import path issue
- `Invalid hook call` → Missing provider/context

### Step 2: Check Story Isolation

Test if the issue is story-specific:

```typescript
// Simplest possible story
export const Minimal: Story = {
  render: () => <div>Test</div>,
};
```

If this works, add complexity incrementally.

### Step 3: Check Payload UI Mocks

If component uses Payload hooks/components not in mock:

```bash
grep -r "from '@payloadcms/ui'" payload/src/your-component/
```

Add missing exports to `.storybook/mocks/@payloadcms/ui.tsx`.

### Step 4: Check Build Output

```bash
npm run build-storybook
```

Build errors often reveal issues hidden in dev mode.

## Automated Prevention

### Add Story Linting (Future Enhancement)

Create a pre-commit hook to validate stories:

```bash
# .husky/pre-commit (add to existing)
npm run test-storybook --ci
```

This catches broken stories before they reach the repo.

### Component Checklist Script

Consider adding a script that verifies:

- Component has matching .test.tsx
- Component has matching .stories.tsx
- Stories file imports component correctly
- No console errors in stories

## Quick Reference

| Issue                                 | Fix                                    |
| ------------------------------------- | -------------------------------------- |
| "useField is not a function"          | Add to Payload UI mock                 |
| "Cannot find module '@payloadcms/ui'" | Check alias in `.storybook/main.ts`    |
| Drag-and-drop not working             | Wrap in DndContext decorator           |
| API calls failing                     | Mock fetch in decorator                |
| CSS not loading                       | Check import path (use relative)       |
| Component not rendering               | Check for missing providers            |
| "Invalid hook call"                   | Ensure hooks inside function component |

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Payload CMS UI Components](https://payloadcms.com/docs/admin/components)
- [MSW for API Mocking](https://mswjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)

## Maintenance

Review this guide when:

- Adding new Payload CMS components
- Upgrading Storybook version
- Encountering new story errors
- Onboarding new team members

Keep `.storybook/mocks/@payloadcms/ui.tsx` updated as the project evolves.
