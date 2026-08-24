export interface CreateGithubIssueArgs {
  title: string;
  body: string;
  labels: string[];
}

export interface CreatedIssue {
  url: string;
  number: number;
}

export class BugReportConfigError extends Error {}

const GITHUB_API = 'https://api.github.com';

/**
 * Create a GitHub issue via the REST API using a server-side token.
 *
 * Reads BUG_REPORT_GITHUB_TOKEN (required) and BUG_REPORT_GITHUB_REPO
 * (owner/repo, defaults to ynotradio/site). Throws BugReportConfigError when the
 * token is missing so callers can return an actionable "not configured" message
 * instead of a generic 500.
 */
export const createGithubIssue = async (
  { title, body, labels }: CreateGithubIssueArgs,
  fetchImpl: typeof fetch = fetch,
): Promise<CreatedIssue> => {
  const token = process.env.BUG_REPORT_GITHUB_TOKEN;
  const repo = process.env.BUG_REPORT_GITHUB_REPO ?? 'ynotradio/site';

  if (!token) {
    throw new BugReportConfigError('Bug reporting is not configured: set BUG_REPORT_GITHUB_TOKEN.');
  }

  const response = await fetchImpl(`${GITHUB_API}/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`GitHub issue creation failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const data = (await response.json()) as { html_url?: string; number?: number };
  if (!data.html_url || typeof data.number !== 'number') {
    throw new Error('GitHub returned an unexpected response shape.');
  }

  return { url: data.html_url, number: data.number };
};
