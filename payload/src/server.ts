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

    const payloadConfigModule = await import('./payload.config');
    const config = payloadConfigModule.default;

    await getPayload({ config });

    // Payload 3 doesn't provide an Express middleware directly
    // Instead, we need to handle routes manually or use Next.js
    // For dev purposes, let's mount the admin panel
    app.get('/admin*', (req, res) => {
      res.send('<html><body><h1>Payload Admin</h1><p>Visit /api for API access</p></body></html>');
    });

    return app;
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
