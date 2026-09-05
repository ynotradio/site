import { describe, it, expect, vi, beforeEach } from 'vitest';

import { composeIssue, getFollowUpQuestions, type AnthropicLike } from './triageWithClaude';
import type { BugReportContext } from '../types';

const context = (): BugReportContext => ({
  url: 'https://admin.example.com/admin',
  pathname: '/admin',
  referrer: '',
  userAgent: 'Test',
  platform: '',
  language: 'en',
  viewport: { width: 100, height: 100 },
  screen: { width: 100, height: 100 },
  timestamp: '2026-08-24T12:00:00.000Z',
  appVersion: null,
  logs: [{ level: 'error', message: 'boom', timestamp: '2026-08-24T12:00:00.000Z' }],
});

const fakeClient = (text: string): AnthropicLike => ({
  messages: { create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text }] }) },
});

describe('getFollowUpQuestions', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('BUG_REPORT_AI_ENABLED', 'true');
  });

  it('returns [] when no API key is configured', async () => {
    const createClient = vi.fn();
    expect(await getFollowUpQuestions('desc', context(), { createClient })).toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns [] for an empty description', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    expect(await getFollowUpQuestions('  ', context())).toEqual([]);
  });

  it('parses a JSON array of questions', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const client = fakeClient('["Which page?", "Any error message?"]');
    const result = await getFollowUpQuestions('desc', context(), { createClient: () => client });
    expect(result).toEqual(['Which page?', 'Any error message?']);
  });

  it('tolerates code fences and extra prose around the JSON', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const client = fakeClient('Sure!\n```json\n["Q1"]\n```');
    const result = await getFollowUpQuestions('desc', context(), { createClient: () => client });
    expect(result).toEqual(['Q1']);
  });

  it('caps at three questions', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const client = fakeClient('["a","b","c","d","e"]');
    const result = await getFollowUpQuestions('desc', context(), { createClient: () => client });
    expect(result).toHaveLength(3);
  });

  it('returns [] when the response is not an array', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const client = fakeClient('nonsense with no json');
    expect(await getFollowUpQuestions('desc', context(), { createClient: () => client })).toEqual(
      [],
    );
  });

  it('returns [] when the client throws', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const client: AnthropicLike = {
      messages: { create: vi.fn().mockRejectedValue(new Error('rate limited')) },
    };
    expect(await getFollowUpQuestions('desc', context(), { createClient: () => client })).toEqual(
      [],
    );
  });
});

describe('composeIssue', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('BUG_REPORT_AI_ENABLED', 'true');
  });

  it('falls back to default labels and null title without an API key', async () => {
    const result = await composeIssue('desc', [], context());
    expect(result).toEqual({ title: null, labels: ['bug', 'in-app-report'] });
  });

  it('parses a title and merges labels, always including bug', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const client = fakeClient('{"title":"Save fails","labels":["wizard","ui"]}');
    const result = await composeIssue('desc', [{ question: 'q', answer: 'a' }], context(), {
      createClient: () => client,
    });
    expect(result.title).toBe('Save fails');
    expect(result.labels).toContain('bug');
    expect(result.labels).toContain('wizard');
  });

  it('falls back when the client throws', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-test');
    const client: AnthropicLike = {
      messages: { create: vi.fn().mockRejectedValue(new Error('boom')) },
    };
    const result = await composeIssue('desc', [], context(), { createClient: () => client });
    expect(result).toEqual({ title: null, labels: ['bug', 'in-app-report'] });
  });
});
