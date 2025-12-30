import path from 'path';

import dotenv from 'dotenv';
import express, { type Express } from 'express';
import { getPayload } from 'payload';

/* eslint-disable no-console */

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
  override: false,
});

let appPromise: Promise<Express> | null = null;

const getUploadsDir = (): string => path.resolve(process.cwd(), 'payload', 'media');

export const initPayloadApp = async (): Promise<Express> => {
  const timestamp = new Date().toISOString();

  if (appPromise) {
    console.log(`[Payload Server] ${timestamp} Returning existing app instance`);
    return appPromise;
  }

  console.log(`[Payload Server] ${timestamp} Creating new app instance`);
  appPromise = (async () => {
    const ts = new Date().toISOString();
    console.log(`[Payload Server] ${ts} Starting initialization...`);
    const app = express();

    app.set('trust proxy', 1);
    app.use('/media', express.static(getUploadsDir()));
    console.log(`[Payload Server] ${ts} Express app configured`);

    try {
      const configLoadTime = new Date().toISOString();
      console.log(`[Payload Server] ${configLoadTime} Loading config...`);
      const payloadConfigModule = await import('./payload.config');
      const config = payloadConfigModule.default;

      console.log(`[Payload Server] ${configLoadTime} Config loaded, initializing Payload...`);
      // Initialize Payload with the config
      await getPayload({ config });

      console.log(`[Payload Server] ${configLoadTime} Initialization complete`);
      // In Payload 3, admin routes are handled by Next.js, not Express
      // This Express server only handles API routes and media serving

      return app;
    } catch (error) {
      const errorTime = new Date().toISOString();
      console.error(`[Payload Server] ${errorTime} Initialization failed:`, error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error(`[Payload Server] ${errorTime} Error name:`, error.name);
        console.error(`[Payload Server] ${errorTime} Error message:`, error.message);
        if (error.stack) {
          console.error(`[Payload Server] ${errorTime} Stack trace:`, error.stack);
        }

        // Log any additional error properties
        const errorKeys = Object.keys(error).filter((k) => k !== 'name' && k !== 'message' && k !== 'stack');
        if (errorKeys.length > 0) {
          console.error(
            `[Payload Server] ${errorTime} Additional error details:`,
            errorKeys.reduce((acc, key) => ({ ...acc, [key]: (error as any)[key] }), {}),
          );
        }
      }

      // Clear the promise so it can be retried
      appPromise = null;

      throw error;
    }
  })();

  return appPromise;
};

export const startPayloadServer = async (): Promise<void> => {
  const port = Number(process.env.PORT ?? 3000);
  const app = await initPayloadApp();

  const payloadConfigModule = await import('./payload.config');
  const config = payloadConfigModule.default;
  const payload = await getPayload({ config });

  app.listen(port, () => {
    payload.logger.info(`Payload server listening on http://localhost:${port}`);
  });
};

if (require.main === module) {
  startPayloadServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}
