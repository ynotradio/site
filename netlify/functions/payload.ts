import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import serverless from 'serverless-http';

import { initPayloadApp } from '../../payload/src/server';

/* eslint-disable no-console */

let handlerInstance: ReturnType<typeof serverless> | null = null;
let initializationError: Error | null = null;

// Setup global error handlers to catch unhandled errors
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Netlify Function] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[Netlify Function] Uncaught Exception:', error);
  });
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const timestamp = new Date().toISOString();
  const requestId = context.requestId || 'unknown';

  try {
    console.log(`[Netlify Function] ${timestamp} [${requestId}] Request: ${event.httpMethod} ${event.path}`);

    // If initialization failed previously, return error
    if (initializationError) {
      console.error(`[Netlify Function] ${timestamp} [${requestId}] Payload initialization failed previously:`, initializationError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Server initialization failed',
          message: initializationError.message,
          timestamp,
        }),
      };
    }

    // Initialize handler instance if not already done
    if (!handlerInstance) {
      try {
        console.log(`[Netlify Function] ${timestamp} [${requestId}] Initializing Payload app...`);
        const app = await initPayloadApp();
        handlerInstance = serverless(app);
        console.log(`[Netlify Function] ${timestamp} [${requestId}] Payload app initialized successfully`);
      } catch (error) {
        initializationError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Netlify Function] ${timestamp} [${requestId}] Failed to initialize Payload app:`, error);

        // Log full error stack
        if (error instanceof Error && error.stack) {
          console.error(`[Netlify Function] ${timestamp} [${requestId}] Stack trace:`, error.stack);
        }

        throw error;
      }
    }

    // Execute the handler
    const result = await handlerInstance(event, context);
    console.log(`[Netlify Function] ${timestamp} [${requestId}] Response status: ${result.statusCode}`);

    return result as any;
  } catch (error) {
    console.error(`[Netlify Function] ${timestamp} [${requestId}] Handler error:`, error);

    // Log full error details
    if (error instanceof Error) {
      console.error(`[Netlify Function] ${timestamp} [${requestId}] Error name:`, error.name);
      console.error(`[Netlify Function] ${timestamp} [${requestId}] Error message:`, error.message);
      if (error.stack) {
        console.error(`[Netlify Function] ${timestamp} [${requestId}] Stack trace:`, error.stack);
      }
      // Log any additional properties
      const errorKeys = Object.keys(error).filter((k) => k !== 'name' && k !== 'message' && k !== 'stack');
      if (errorKeys.length > 0) {
        console.error(
          `[Netlify Function] ${timestamp} [${requestId}] Additional error info:`,
          errorKeys.reduce((acc, key) => ({ ...acc, [key]: (error as any)[key] }), {}),
        );
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
        timestamp,
        requestId,
      }),
    };
  }
};
