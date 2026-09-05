import { describe, it, expect } from 'vitest';

import { buildIssueTitle, formatIssueBody } from './formatIssueBody';
import type { BugReportContext } from '../types';

const baseContext = (): BugReportContext => ({
  url: 'https://admin.example.com/admin/collections/shows',
  pathname: '/admin/collections/shows',
  referrer: 'https://admin.example.com/admin',
  userAgent: 'Mozilla/5.0 (Test)',
  platform: 'MacIntel',
  language: 'en-US',
  viewport: { width: 1280, height: 800 },
  screen: { width: 2560, height: 1440 },
  timestamp: '2026-08-24T12:00:00.000Z',
  appVersion: 'abc123',
  logs: [],
});

describe('buildIssueTitle', () => {
  it('prefixes and uses the first non-empty line of the description', () => {
    expect(buildIssueTitle('\n  Save button does nothing\nmore detail')).toBe(
      '[Bug] Save button does nothing',
    );
  });

  it('prefers an AI-provided title when present', () => {
    expect(buildIssueTitle('vague text', 'Show save fails silently')).toBe(
      '[Bug] Show save fails silently',
    );
  });

  it('truncates very long titles', () => {
    const title = buildIssueTitle('x'.repeat(200));
    expect(title.length).toBeLessThanOrEqual(107);
    expect(title.endsWith('…')).toBe(true);
  });

  it('falls back to a default when description is empty', () => {
    expect(buildIssueTitle('   ')).toBe('[Bug] Bug report');
  });
});

describe('formatIssueBody', () => {
  it('includes description, context table, and reporter', () => {
    const body = formatIssueBody({
      description: 'The wizard will not save.',
      answers: [],
      context: baseContext(),
      reporter: { id: 7, email: 'josh@ynotradio.net' },
      screenshotUrl: null,
    });

    expect(body).toContain('### What happened');
    expect(body).toContain('The wizard will not save.');
    expect(body).toContain('| Reporter | josh@ynotradio.net (id: 7) |');
    expect(body).toContain('/admin/collections/shows');
    expect(body).toContain('1280×800');
    expect(body).toContain('_Filed from the Payload admin bug reporter._');
  });

  it('renders follow-up answers and skips empty ones', () => {
    const body = formatIssueBody({
      description: 'desc',
      answers: [
        { question: 'Which step?', answer: 'The album step' },
        { question: 'Any error?', answer: '   ' },
      ],
      context: baseContext(),
      reporter: null,
      screenshotUrl: null,
    });

    expect(body).toContain('### Follow-up details');
    expect(body).toContain('**Which step?**');
    expect(body).toContain('The album step');
    expect(body).not.toContain('Any error?');
  });

  it('embeds the screenshot when a URL is provided', () => {
    const body = formatIssueBody({
      description: 'desc',
      answers: [],
      context: baseContext(),
      reporter: null,
      screenshotUrl: 'https://cdn.example.com/shot.png',
    });
    expect(body).toContain('![Screenshot](https://cdn.example.com/shot.png)');
  });

  it('notes an unknown reporter when not signed in', () => {
    const body = formatIssueBody({
      description: 'desc',
      answers: [],
      context: baseContext(),
      reporter: null,
      screenshotUrl: null,
    });
    expect(body).toContain('Unknown (not signed in)');
  });

  it('includes a collapsed log section and caps the number of entries', () => {
    const context = baseContext();
    context.logs = Array.from({ length: 50 }, (_, i) => ({
      level: 'error' as const,
      message: `error ${i}`,
      timestamp: '2026-08-24T12:00:00.000Z',
    }));

    const body = formatIssueBody({
      description: 'desc',
      answers: [],
      context,
      reporter: null,
      screenshotUrl: null,
    });

    expect(body).toContain('### Console & network logs');
    expect(body).toContain('50 captured entrie(s)');
    expect(body).toContain('earlier entrie(s) omitted');
    expect(body).toContain('error 49');
    expect(body).not.toContain('error 5\n');
  });

  it('escapes pipe characters in context values', () => {
    const context = baseContext();
    context.userAgent = 'Weird|Agent';
    const body = formatIssueBody({
      description: 'desc',
      answers: [],
      context,
      reporter: null,
      screenshotUrl: null,
    });
    expect(body).toContain('Weird\\|Agent');
  });
});
