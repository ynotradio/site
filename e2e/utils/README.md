# E2E Test Utilities

This directory contains reusable helper functions and utilities for Playwright E2E tests following best practices from [Writing Reusable Functions and Custom Helpers in Playwright](https://medium.com/@divyakandpal93/writing-reusable-functions-and-custom-helpers-in-playwright-7176c3c0c490).

## Available Utilities

### `payload-auth.ts`

Authentication helper for Payload CMS admin interface.

```typescript
import { loginToPayload } from './utils/payload-auth';

// Login with default credentials from environment variables
await loginToPayload(page);

// Login with custom credentials
await loginToPayload(page, 'admin@example.com', 'password123');
```

### `payload-helpers.ts`

Payload CMS-specific helper functions for common UI interactions.

```typescript
import {
  navigateToPayloadCollection,
  clickPayloadCreateNew,
  fillPayloadRelationshipField,
  fillPayloadTextField,
  fillPayloadCheckboxField,
  fillPayloadTimeField,
  fillPayloadRichTextField,
  clickPayloadSave,
  clickPayloadPublish,
  waitForPayloadSave,
  navigateToLegacySiteWithPostgres,
} from './utils/payload-helpers';

// Navigate to a collection
await navigateToPayloadCollection(page, 'concerts');

// Click "Create New" button
await clickPayloadCreateNew(page);

// Fill relationship fields (dropdowns)
await fillPayloadRelationshipField(page, 'field-artists', 0);

// Fill text fields
await fillPayloadTextField(page, 'field-ticketInfo', 'Test info');

// Fill checkbox fields
await fillPayloadCheckboxField(page, 'field-onAir', true);

// Fill time fields (HH:MM format)
await fillPayloadTimeField(page, 'field-startTime', '14:00');

// Fill rich text fields (use field name without 'field-' prefix)
await fillPayloadRichTextField(page, 'content', 'Hello world');

// Save and wait for confirmation
await clickPayloadSave(page);
await waitForPayloadSave(page, 'concerts');

// For collections with drafts (e.g., Posts), use publish
await clickPayloadPublish(page, 'posts');

// Navigate to legacy site with PostgreSQL feature flag
await navigateToLegacySiteWithPostgres(page, 'schedule.php', 'use_postgres_schedule');
```

### `test-helpers.ts`

General-purpose test utilities for screenshots, navigation, and common operations.

```typescript
import {
  captureScreenshot,
  navigateAndCapture,
  fillPayloadDateField,
  checkForPhpErrors,
  getFutureDate,
  generateUniqueId,
} from './utils/test-helpers';

// Capture and attach a screenshot
await captureScreenshot(page, testInfo, 'My Screenshot');

// Navigate and optionally capture screenshot
await navigateAndCapture(page, 'http://localhost:3000', testInfo, 'Page Load');

// Fill a Payload date field
const date = getFutureDate(3); // 3 days from now
await fillPayloadDateField(page, 'field-date', date);

// Check page content for PHP errors
const errors = checkForPhpErrors(pageContent);
expect(errors).toHaveLength(0);

// Generate unique identifiers for test data
const uniqueId = generateUniqueId('concert');
```

## Benefits

1. **DRY Principle**: Avoid repeating the same code across multiple tests
2. **Maintainability**: Update logic in one place when UI changes
3. **Readability**: Tests become more focused on the test scenario
4. **Consistency**: Ensures all tests use the same patterns
5. **Best Practices**: Following Playwright's recommended patterns (getByRole, getByLabel, etc.)

## Writing New Helpers

When creating new helper functions:

1. **Keep them focused**: Each function should do one thing well
2. **Use semantic locators**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
3. **Add TypeScript types**: All parameters should be properly typed
4. **Document parameters**: Use JSDoc comments to explain what each parameter does
5. **Handle errors gracefully**: Include appropriate timeouts and error messages
6. **Make them reusable**: Consider how the function might be used in different contexts

## Example: Before and After

**Before** (repetitive code):
```typescript
const screenshot = await page.screenshot({ fullPage: true });
await testInfo.attach('Login Page', {
  body: screenshot,
  contentType: 'image/png',
});
```

**After** (using helper):
```typescript
await captureScreenshot(page, testInfo, 'Login Page');
```

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Reusable Functions in Playwright](https://medium.com/@divyakandpal93/writing-reusable-functions-and-custom-helpers-in-playwright-7176c3c0c490)
- [Page Object Models](https://playwright.dev/docs/pom)
