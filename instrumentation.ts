// This file runs before Next.js initializes on the server
// It's used for instrumentation and logging setup
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    console.log('[Instrumentation] Server starting...', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
      hasDatabaseUri: !!(process.env.DATABASE_URI || process.env.NEON_DEV_DATABASE_URL),
      hasPayloadSecret: !!process.env.PAYLOAD_SECRET,
      NETLIFY: process.env.NETLIFY,
      CONTEXT: process.env.CONTEXT,
    });
    
    // Override console.error to ensure errors are visible
    const originalError = console.error;
    console.error = function(...args: any[]) {
      originalError('[ERROR]', ...args);
    };
  }
}
