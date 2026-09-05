import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

import {
  buildIssueTitle,
  formatIssueBody,
} from '../../../payload/src/features/bug-report/server/formatIssueBody';
import {
  BugReportConfigError,
  createGithubIssue,
} from '../../../payload/src/features/bug-report/server/createGithubIssue';
import { uploadScreenshot } from '../../../payload/src/features/bug-report/server/uploadScreenshot';
import { composeIssue } from '../../../payload/src/features/bug-report/server/triageWithClaude';
import type {
  BugReporter,
  SubmitRequest,
  SubmitResponse,
} from '../../../payload/src/features/bug-report/types';

const isValidBody = (body: unknown): body is SubmitRequest => {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Partial<SubmitRequest>;
  return (
    typeof candidate.description === 'string'
    && Array.isArray(candidate.answers)
    && typeof candidate.context === 'object'
    && candidate.context !== null
  );
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = await getPayload({ config });

  // Only authenticated admin users may file reports (prevents abuse of the
  // GitHub token and attributes the reporter reliably).
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

  if (!body.description.trim()) {
    return NextResponse.json({ error: 'A description is required.' }, { status: 400 });
  }

  const reporter: BugReporter = {
    id: (user as { id: string | number }).id,
    email: (user as { email?: string }).email ?? null,
  };

  try {
    const [screenshotUrl, composed] = await Promise.all([
      uploadScreenshot(body.screenshot ?? null),
      composeIssue(body.description, body.answers, body.context),
    ]);

    const title = buildIssueTitle(body.description, composed.title);
    const issueBody = formatIssueBody({
      description: body.description,
      answers: body.answers,
      context: body.context,
      reporter,
      screenshotUrl,
    });

    const issue = await createGithubIssue({ title, body: issueBody, labels: composed.labels });

    const result: SubmitResponse = { url: issue.url, number: issue.number };
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof BugReportConfigError) {
      payload.logger.warn({ msg: 'Bug report submitted but not configured', err });
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'Failed to file bug report.';
    payload.logger.error({ msg: 'Bug report failed', err });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
