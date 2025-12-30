# Netlify Logging Setup

This document explains the logging infrastructure for debugging production deployments on Netlify.

## Overview

The application now has comprehensive logging to help diagnose issues when pages fail after deployment. Logs are captured at multiple levels and are viewable in the Netlify dashboard.

## Where Logs Appear

### 1. Netlify Function Logs
- **Location**: Netlify Dashboard → Functions → Function Logs
- **What's captured**: 
  - All `console.log`, `console.error`, `console.warn` from serverless functions
  - Request/response information with timestamps and request IDs
  - Initialization errors
  - Unhandled promise rejections and uncaught exceptions

### 2. Build Logs
- **Location**: Netlify Dashboard → Deploys → Deploy Details
- **What's captured**: 
  - Build-time console statements
  - Compilation errors
  - Environment validation

### 3. Real-time Logs
View logs in real-time using the Netlify CLI:
```bash
# View function logs
npm run netlify:logs

# View live function logs
npm run netlify:logs:live
```

## Logging Components

### 1. Netlify Function Error Handler
**File**: `netlify/functions/payload.ts`

Enhanced with:
- Structured logging with timestamps and request IDs
- Comprehensive error details (name, message, stack trace)
- Global handlers for unhandled rejections and uncaught exceptions
- Initialization error caching to prevent repeated failures
- Detailed request/response logging

### 2. Next.js Error Boundaries
**Files**: `app/error.tsx`, `app/global-error.tsx`

Provides:
- Client and server-side error catching
- Console logging of all caught errors
- User-friendly error display
- Error details including digest (for Next.js internal errors)

### 3. Instrumentation Hook
**File**: `instrumentation.ts`

Registers global error handlers:
- Unhandled promise rejections
- Uncaught exceptions
- Process warnings
- Runs before the application starts

### 4. Payload Server Logging
**File**: `payload/src/server.ts`

Enhanced with:
- Timestamped log messages
- Detailed initialization flow tracking
- Comprehensive error logging with stack traces
- Error property inspection

### 5. Payload Config Logging
**Files**: `payload/payload.config.ts`, `payload/src/payload.config.ts`

Includes:
- Environment variable validation logging
- Database connection status
- Build vs runtime phase detection

## Log Message Format

All logs follow a consistent format:
```
[Component] TIMESTAMP [REQUEST_ID] Message: details
```

Example:
```
[Netlify Function] 2025-12-30T00:15:00.000Z [abc123] Request: GET /api/posts
```

## Debugging Production Issues

When pages fail after deployment:

1. **Check Netlify Function Logs**
   - Go to Netlify Dashboard → Functions
   - Look for error messages with `[Netlify Function]` prefix
   - Check for initialization errors or request failures

2. **Check Deploy Logs**
   - Go to Netlify Dashboard → Deploys → Your deploy
   - Look for build-time errors with `[Payload Config]` prefix

3. **Use Real-time Logs**
   ```bash
   npm run netlify:logs:live
   ```
   Then trigger the failure to see logs in real-time

4. **Look for Patterns**
   - Initialization errors: `[Payload Server] Initialization failed`
   - Configuration errors: `[Payload Config] DATABASE_URI is missing`
   - Runtime errors: `[Netlify Function] Handler error`
   - Unhandled errors: `Unhandled Rejection` or `Uncaught Exception`

## Environment Variables

Key environment variables that are logged (values are hidden):
- `NODE_ENV`
- `NEXT_PHASE`
- `DATABASE_URI` (presence checked, value hidden)
- `PAYLOAD_SECRET` (presence checked, value hidden)
- `DATABASE_SSL`
- `PAYLOAD_PUBLIC_SERVER_URL`

## Testing Locally

To test the logging locally:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Trigger an error intentionally to see logs

3. Check your terminal for log output

## Best Practices

1. **Always use structured logging**: Include timestamps and context
2. **Log at appropriate levels**: Use `console.error` for errors, `console.log` for info
3. **Include request IDs**: Helps trace requests across the system
4. **Log before throwing**: Ensure errors are logged before they propagate
5. **Don't log secrets**: Environment variable values are hidden in logs

## Troubleshooting

### Logs not appearing?
- Ensure you're looking in the right place (function logs vs build logs)
- Check that the code path is actually executing
- Verify you're using `console.error` or `console.log` (not just throwing)

### Too much noise?
- Use log filtering in Netlify dashboard
- Search for specific prefixes like `[Netlify Function]` or `ERROR`

### Need more context?
- Add more logging around the problematic area
- Include relevant variables and state
- Use structured logging with objects for complex data
