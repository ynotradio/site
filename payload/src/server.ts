import path from 'path';

import dotenv from 'dotenv';
import express, { type Express } from 'express';
import { getPayload } from 'payload';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
  override: false,
});

let appPromise: Promise<Express> | null = null;

const getUploadsDir = (): string => path.resolve(process.cwd(), 'payload', 'media');

export const initPayloadApp = async (): Promise<Express> => {
  if (appPromise) {
    return appPromise;
  }

  appPromise = (async () => {
    const app = express();

    app.set('trust proxy', 1);
    app.use('/media', express.static(getUploadsDir()));

    try {
      const payloadConfigModule = await import('./payload.config');
      const config = payloadConfigModule.default;

      // Initialize Payload with the config
      await getPayload({ config });

      // In Payload 3, admin routes are handled by Next.js, not Express
      // This Express server only handles API routes and media serving

      return app;
    } catch (error) {
      // Log error details for Netlify function logs
      // eslint-disable-next-line no-console
      console.error('[Payload Server] Initialization failed:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          hasDatabaseUri: !!(process.env.DATABASE_URI || process.env.NEON_DEV_DATABASE_URL),
          hasPayloadSecret: !!process.env.PAYLOAD_SECRET,
        },
      });
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
