// This file is used to configure Next.js instrumentation and error tracking
// It runs before the application starts
/* eslint-disable no-console */

export async function register() {
  const timestamp = new Date().toISOString();
  console.log(`[Next.js Instrumentation] ${timestamp} Registering instrumentation...`);

  // Setup global error handlers
  if (typeof process !== 'undefined') {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const ts = new Date().toISOString();
      console.error(`[Next.js Instrumentation] ${ts} Unhandled Rejection:`, reason);
      console.error(`[Next.js Instrumentation] ${ts} Promise:`, promise);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      const ts = new Date().toISOString();
      console.error(`[Next.js Instrumentation] ${ts} Uncaught Exception:`, error);
      if (error.stack) {
        console.error(`[Next.js Instrumentation] ${ts} Stack trace:`, error.stack);
      }
    });

    // Handle warnings
    process.on('warning', (warning) => {
      const ts = new Date().toISOString();
      console.warn(`[Next.js Instrumentation] ${ts} Warning:`, warning.name, warning.message);
      if (warning.stack) {
        console.warn(`[Next.js Instrumentation] ${ts} Stack:`, warning.stack);
      }
    });

    console.log(`[Next.js Instrumentation] ${timestamp} Global error handlers registered`);
  }

  console.log(`[Next.js Instrumentation] ${timestamp} Instrumentation complete`);
}
