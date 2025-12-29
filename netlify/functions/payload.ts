import type { Handler } from '@netlify/functions';
import serverless from 'serverless-http';

import { initPayloadApp } from '../../payload/src/server';

let handlerInstance: ReturnType<typeof serverless> | null = null;

export const handler: Handler = async (event, context) => {
  if (!handlerInstance) {
    const app = await initPayloadApp();
    handlerInstance = serverless(app);
  }

  return handlerInstance(event, context);
};
