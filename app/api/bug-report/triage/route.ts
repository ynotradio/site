import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

import { getFollowUpQuestions } from '../../../../payload/src/features/bug-report/server/triageWithClaude';
import type {
  TriageRequest,
  TriageResponse,
} from '../../../../payload/src/features/bug-report/types';

const isValidBody = (body: unknown): body is TriageRequest => {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Partial<TriageRequest>;
  return (
    typeof candidate.description === 'string'
    && typeof candidate.context === 'object'
    && candidate.context !== null
  );
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = await getPayload({ config });

  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: 'Missing description or context.' }, { status: 400 });
  }

  // getFollowUpQuestions degrades to [] when the AI is unconfigured or errors,
  // so the widget can always proceed to submission.
  const questions = await getFollowUpQuestions(body.description, body.context);
  const result: TriageResponse = { questions };
  return NextResponse.json(result);
}
