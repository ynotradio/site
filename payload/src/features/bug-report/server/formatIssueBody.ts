import type {
  BugReportContext, BugReporter, FollowUpAnswer, LogEntry,
} from '../types';

export interface FormatIssueInput {
  description: string;
  answers: FollowUpAnswer[];
  context: BugReportContext;
  reporter: BugReporter | null;
  /** Public URL of the uploaded screenshot, when one was captured and stored. */
  screenshotUrl: string | null;
}

// GitHub rejects issue bodies larger than 65536 characters. We stay well under
// that and cap the log section so a noisy console can't blow the budget.
const MAX_LOG_ENTRIES = 40;
const MAX_BODY_CHARS = 60000;

const formatLog = (entry: LogEntry): string => {
  const level = entry.level.toUpperCase().padEnd(7);
  return `${entry.timestamp}  ${level} ${entry.message}`;
};

/**
 * Build a GitHub issue title from the description. Uses the first non-empty
 * line, trimmed to a sensible length, with a stable prefix so in-app reports
 * are easy to spot and filter.
 */
export const buildIssueTitle = (description: string, aiTitle?: string | null): string => {
  const source = (aiTitle && aiTitle.trim()) || description.trim();
  const firstLine = source
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean) ?? 'Bug report';
  const trimmed = firstLine.length > 100 ? `${firstLine.slice(0, 97)}…` : firstLine;
  return `[Bug] ${trimmed}`;
};

/**
 * Assemble the full Markdown issue body from the report and its captured
 * context. Pure and deterministic so it can be unit-tested without any network.
 */
export const formatIssueBody = ({
  description,
  answers,
  context,
  reporter,
  screenshotUrl,
}: FormatIssueInput): string => {
  const sections: string[] = [];

  sections.push('### What happened', description.trim() || '_No description provided._');

  if (answers.length > 0) {
    const qa = answers
      .filter((entry) => entry.answer.trim())
      .map((entry) => `**${entry.question}**\n\n${entry.answer.trim()}`)
      .join('\n\n');
    if (qa) {
      sections.push('### Follow-up details', qa);
    }
  }

  if (screenshotUrl) {
    sections.push('### Screenshot', `![Screenshot](${screenshotUrl})`);
  }

  const reporterLine = reporter
    ? `${reporter.email ?? 'unknown'} (id: ${reporter.id})`
    : 'Unknown (not signed in)';

  const contextRows = [
    ['Reporter', reporterLine],
    ['Page', context.url],
    ['Referrer', context.referrer || '—'],
    ['When', context.timestamp],
    ['App version', context.appVersion ?? '—'],
    ['Browser', context.userAgent],
    ['Platform', context.platform || '—'],
    ['Language', context.language || '—'],
    ['Viewport', `${context.viewport.width}×${context.viewport.height}`],
    ['Screen', `${context.screen.width}×${context.screen.height}`],
  ];

  const contextTable = [
    '| Field | Value |',
    '| --- | --- |',
    ...contextRows.map(([field, value]) => `| ${field} | ${String(value).replace(/\|/g, '\\|')} |`),
  ].join('\n');

  sections.push('### Context', contextTable);

  if (context.logs.length > 0) {
    const logs = context.logs.slice(-MAX_LOG_ENTRIES).map(formatLog).join('\n');
    const omitted = context.logs.length > MAX_LOG_ENTRIES
      ? `\n… ${context.logs.length - MAX_LOG_ENTRIES} earlier entrie(s) omitted`
      : '';
    sections.push(
      '### Console & network logs',
      `<details>\n<summary>${context.logs.length} captured entrie(s)</summary>\n\n\`\`\`\n${logs}${omitted}\n\`\`\`\n</details>`,
    );
  }

  sections.push('---', '_Filed from the Payload admin bug reporter._');

  const body = sections.join('\n\n');
  return body.length > MAX_BODY_CHARS ? `${body.slice(0, MAX_BODY_CHARS)}\n\n_…truncated._` : body;
};
