import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limitParam = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, limitParam || DEFAULT_LIMIT), MAX_LIMIT);
  const djId = searchParams.get('dj');

  const where: Record<string, unknown> = {
    _status: { equals: 'published' },
  };

  if (djId) {
    where.djs = { in: [djId] };
  }

  try {
    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: 'ondemand',
      where,
      page,
      limit,
      depth: 1,
      sort: '-date',
    });

    return NextResponse.json(
      {
        docs: result.docs,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders },
    );
  }
}
