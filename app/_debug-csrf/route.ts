import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const payload = await getPayload({ config });
  return NextResponse.json({
    csrf: payload.config.csrf,
    cors: payload.config.cors,
    env: {
      DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL ?? null,
      DEPLOY_URL: process.env.DEPLOY_URL ?? null,
      URL: process.env.URL ?? null,
      CONTEXT: process.env.CONTEXT ?? null,
      PAYLOAD_CSRF: process.env.PAYLOAD_CSRF ?? null,
      PAYLOAD_PUBLIC_SERVER_URL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? null,
    },
  });
}
