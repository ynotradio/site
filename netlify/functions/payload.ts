import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import serverless from 'serverless-http';

import { initPayloadApp } from '../../payload/src/server';

let handlerInstance: ReturnType<typeof serverless> | null = null;

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (!handlerInstance) {
    const app = await initPayloadApp();
    handlerInstance = serverless(app);
  }

  const result = await handlerInstance(event, context);
  return result as any; // serverless-http returns an object compatible with Netlify
};
