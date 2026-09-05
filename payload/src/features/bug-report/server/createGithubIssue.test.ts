import { describe, it, expect, vi, beforeEach } from 'vitest';

import { BugReportConfigError, createGithubIssue } from './createGithubIssue';

describe('createGithubIssue', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws BugReportConfigError when the token is missing', async () => {
    vi.stubEnv('BUG_REPORT_GITHUB_TOKEN', '');
    await expect(createGithubIssue({ title: 't', body: 'b', labels: [] })).rejects.toBeInstanceOf(
      BugReportConfigError,
    );
  });

  it('POSTs to the configured repo with auth headers and returns the issue', async () => {
    vi.stubEnv('BUG_REPORT_GITHUB_TOKEN', 'ghp_test');
    vi.stubEnv('BUG_REPORT_GITHUB_REPO', 'acme/widgets');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/acme/widgets/issues/12', number: 12 }),
    });

    const result = await createGithubIssue(
      { title: 'Broken', body: 'Body', labels: ['bug'] },
      fetchMock as unknown as typeof fetch,
    );

    expect(result).toEqual({ url: 'https://github.com/acme/widgets/issues/12', number: 12 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/acme/widgets/issues');
    expect(init.headers.Authorization).toBe('Bearer ghp_test');
    expect(JSON.parse(init.body)).toEqual({ title: 'Broken', body: 'Body', labels: ['bug'] });
  });

  it('defaults the repo to ynotradio/site', async () => {
    vi.stubEnv('BUG_REPORT_GITHUB_TOKEN', 'ghp_test');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/ynotradio/site/issues/1', number: 1 }),
    });

    await createGithubIssue(
      { title: 't', body: 'b', labels: [] },
      fetchMock as unknown as typeof fetch,
    );

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.github.com/repos/ynotradio/site/issues');
  });

  it('throws with status detail when GitHub responds with an error', async () => {
    vi.stubEnv('BUG_REPORT_GITHUB_TOKEN', 'ghp_test');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Validation failed',
    });

    await expect(
      createGithubIssue(
        { title: 't', body: 'b', labels: [] },
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toThrow(/422.*Validation failed/);
  });

  it('throws when GitHub returns an unexpected shape', async () => {
    vi.stubEnv('BUG_REPORT_GITHUB_TOKEN', 'ghp_test');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ unexpected: true }),
    });

    await expect(
      createGithubIssue(
        { title: 't', body: 'b', labels: [] },
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toThrow(/unexpected response shape/);
  });
});
