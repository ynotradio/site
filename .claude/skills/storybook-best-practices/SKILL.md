# Storybook Best Practices

## When to Use This Skill

Use this skill when:

- Creating new `.stories.tsx` files for React components
- Debugging Storybook rendering errors
- Components fail to render in Storybook UI
- Adding components that use Payload CMS UI
- Working with complex components requiring providers (@dnd-kit, etc.)
- Need to validate story files before committing

## Key Concepts

### Payload CMS UI Mocking

All Payload UI components and hooks must be mocked for Storybook. The mocks live in `.storybook/mocks/@payloadcms/ui.tsx`.

**Currently Mocked:**

- `useField` - Field value management
- `useFormFields` - Form data access
- `Gutter` - Layout wrapper component
- `useStepNav` - Breadcrumb navigation

**When adding new Payload UI dependencies:**

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

Then update `ALLOWED_PAYLOAD_IMPORTS` in `scripts/validate-stories.mjs`.

### Provider Wrapping

Components using external libraries need proper context providers in story decorators:

```typescript
// For @dnd-kit components
decorators: [
  (Story, context) => (
    <DndContext>
      <SortableContext
        items={[context.args.id]}
        strategy={verticalListSortingStrategy}
      >
        <Story />
      </SortableContext>
    </DndContext>
  ),
],
```

### API/Fetch Mocking

Components that fetch data need mocked responses:

```typescript
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

## Story File Template

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
        component: 'Brief description of component functionality.',
      },
    },
  },
  tags: ['autodocs'],
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

export const Default: Story = {
  args: {
    // Default props
  },
};

export const WithError: Story = {
  args: {
    error: 'Something went wrong',
  },
};
```

## Validation Workflow

### Before Committing Stories

1. **Run automated validation:**

   ```bash
   npm run validate-stories
   ```

2. **Start Storybook and test manually:**

   ```bash
   npm run storybook
   ```

   - Navigate to your stories in sidebar
   - Check browser console for errors (F12)
   - Test interactive elements
   - Verify all story variants render

3. **Fix issues using:**
   - Check Payload UI mocks in `.storybook/mocks/@payloadcms/ui.tsx`
   - Add missing providers in decorators
   - Mock API calls if component fetches data

### Validation Script Features

The `npm run validate-stories` script checks:

- ✅ Required story structure (meta export, default export, stories)
- ✅ Unmocked Payload UI imports
- ✅ Missing provider wrappers (DndContext detection)
- ✅ Unhandled API/fetch calls
- ✅ Component import correctness
- ✅ Payload UI mock completeness

## Common Issues & Solutions

### Issue: "useField is not a function"

**Solution:** Add export to `.storybook/mocks/@payloadcms/ui.tsx`

### Issue: "Cannot find module '@payloadcms/ui'"

**Solution:** Check alias in `.storybook/main.ts` points to correct mock file

### Issue: Drag-and-drop not working

**Solution:** Wrap in DndContext decorator (see Provider Wrapping above)

### Issue: API calls failing

**Solution:** Mock fetch in decorator or use MSW addon

### Issue: CSS not loading

**Solution:** Use relative import paths: `import './Component.css'`

### Issue: Component not rendering

**Solution:** Check for missing providers/context wrappers

### Issue: "Invalid hook call"

**Solution:** Ensure hooks are inside function component, not in story setup

## CSS Best Practices

**Good:** Relative path in component

```typescript
import './Component.css';
```

**Bad:** Alias path (may fail in Storybook)

```typescript
import '@/path/to/Component.css';
```

Vite handles CSS imports automatically in Storybook.

## Debugging Steps

1. **Check browser console** (F12) for specific error messages
2. **Test minimal story** to isolate issue:
   ```typescript
   export const Minimal: Story = {
     render: () => <div>Test</div>,
   };
   ```
3. **Verify Payload UI mocks** have required exports
4. **Check build output**: `npm run build-storybook`
5. **Review validation output**: `npm run validate-stories`

## Quick Reference

| Problem                        | Solution                                     |
| ------------------------------ | -------------------------------------------- |
| Missing Payload hook/component | Add to `.storybook/mocks/@payloadcms/ui.tsx` |
| Drag-drop not working          | Add DndContext in decorators                 |
| API errors                     | Mock fetch in decorators                     |
| CSS not loading                | Use relative imports in component            |
| Component not rendering        | Check for missing providers                  |
| Validation fails               | Fix issues reported by script                |

## Files to Know

- `.storybook/mocks/@payloadcms/ui.tsx` - Payload UI mocks
- `.storybook/main.ts` - Storybook configuration
- `scripts/validate-stories.mjs` - Validation script
- Component `.stories.tsx` files - Story definitions

## Integration with PR Standards

Stories are **required** for all components per PR #173:

- Every `Component.tsx` needs `Component.stories.tsx`
- Validation runs before commits via `npm run validate-stories`
- Stories must render without errors
- At least 2 stories per component (Default + variant)

See `test-story-coupling` skill for enforcement details.
