import Anthropic from '@anthropic-ai/sdk';

import type { BugReportContext, FollowUpAnswer } from '../types';

// Keep the model swappable via env, but default to a current, capable model.
const MODEL = process.env.BUG_REPORT_AI_MODEL ?? 'claude-opus-5';
const MAX_QUESTIONS = 3;

/** Minimal shape of the Anthropic client we depend on — keeps tests SDK-free. */
export interface AnthropicLike {
  messages: {
    create: (args: Record<string, unknown>) => Promise<{
      content: Array<{ type: string; text?: string }>;
    }>;
  };
}

export interface TriageDeps {
  /** Factory for the Anthropic client; overridable in tests. */
  createClient?: () => AnthropicLike;
}

const hasApiKey = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY);

const defaultCreateClient = (): AnthropicLike => new Anthropic() as unknown as AnthropicLike;

const firstText = (content: Array<{ type: string; text?: string }>): string => content
  .filter((block) => block.type === 'text' && typeof block.text === 'string')
  .map((block) => block.text as string)
  .join('\n')
  .trim();

/**
 * Pull the first JSON object/array out of a model response, tolerating stray
 * prose or code fences the model may wrap around it.
 */
const extractJson = (text: string): unknown => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf(']'), candidate.lastIndexOf('}'));
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const contextDigest = (context: BugReportContext): string => {
  const recentLogs = context.logs
    .slice(-15)
    .map((l) => `[${l.level}] ${l.message}`)
    .join('\n');
  return [
    `Page: ${context.url}`,
    `Browser: ${context.userAgent}`,
    recentLogs ? `Recent logs:\n${recentLogs}` : 'Recent logs: (none captured)',
  ].join('\n');
};

/**
 * Ask Claude for up to three targeted clarifying questions about a bug report.
 * Returns an empty array when the AI isn't configured or anything goes wrong —
 * follow-up questions are an enhancement and must never block a report.
 */
export const getFollowUpQuestions = async (
  description: string,
  context: BugReportContext,
  deps: TriageDeps = {},
): Promise<string[]> => {
  if (!hasApiKey() || !description.trim()) {
    return [];
  }

  try {
    const client = (deps.createClient ?? defaultCreateClient)();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system:
        "You triage bug reports for an internal CMS. Given a user's description and "
        + 'technical context, decide what is still unclear. Return ONLY a JSON array of at '
        + `most ${MAX_QUESTIONS} short, specific follow-up questions a developer would need `
        + 'answered to reproduce the bug. If the report is already clear, return []. '
        + 'Never ask for information already present in the context.',
      messages: [
        {
          role: 'user',
          content: `Description:\n${description}\n\n${contextDigest(context)}`,
        },
      ],
    });

    const parsed = extractJson(firstText(response.content));
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      .slice(0, MAX_QUESTIONS)
      .map((q) => q.trim());
  } catch {
    return [];
  }
};

export interface ComposedIssue {
  title: string | null;
  labels: string[];
}

const DEFAULT_LABELS = ['bug', 'in-app-report'];

/**
 * Ask Claude to suggest a concise issue title and labels. Falls back to a null
 * title (caller derives one from the description) and default labels on any
 * failure or when the AI isn't configured.
 */
export const composeIssue = async (
  description: string,
  answers: FollowUpAnswer[],
  context: BugReportContext,
  deps: TriageDeps = {},
): Promise<ComposedIssue> => {
  const fallback: ComposedIssue = { title: null, labels: DEFAULT_LABELS };
  if (!hasApiKey() || !description.trim()) {
    return fallback;
  }

  try {
    const client = (deps.createClient ?? defaultCreateClient)();
    const answerText = answers
      .filter((a) => a.answer.trim())
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system:
        'You label bug reports for an internal CMS. Return ONLY a JSON object with keys '
        + '"title" (a concise imperative issue title under 80 chars, no leading "Bug:") and '
        + '"labels" (an array of 1-4 short kebab-case labels). Always include the label "bug".',
      messages: [
        {
          role: 'user',
          content: `Description:\n${description}\n\n${answerText}\n\nPage: ${context.url}`,
        },
      ],
    });

    const parsed = extractJson(firstText(response.content)) as {
      title?: unknown;
      labels?: unknown;
    } | null;
    if (!parsed || typeof parsed !== 'object') {
      return fallback;
    }

    const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : null;
    const labels = Array.isArray(parsed.labels)
      ? parsed.labels.filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
      : [];
    const merged = Array.from(new Set(['bug', 'in-app-report', ...labels])).slice(0, 6);

    return { title, labels: merged.length > 0 ? merged : DEFAULT_LABELS };
  } catch {
    return fallback;
  }
};
