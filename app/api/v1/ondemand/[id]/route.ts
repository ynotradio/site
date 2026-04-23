import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const payload = await getPayload({ config });

    const doc = await payload.findByID({
      collection: 'ondemand',
      id,
      depth: 1,
    });

    if (!doc || doc._status !== 'published') {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(doc, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';

    if (message.toLowerCase().includes('not found') || message.includes('404')) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders },
    );
  }
}
