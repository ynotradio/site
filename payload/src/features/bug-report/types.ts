// Shared types for the in-app bug reporting feature.
// The admin widget collects a description plus rich context, optionally runs an
// AI follow-up step, then files a GitHub issue via the server routes.

export type LogLevel = 'error' | 'warn' | 'log' | 'info' | 'network';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
}

export interface BugReportContext {
  url: string;
  pathname: string;
  referrer: string;
  userAgent: string;
  platform: string;
  language: string;
  viewport: { width: number; height: number };
  screen: { width: number; height: number };
  timestamp: string;
  appVersion: string | null;
  logs: LogEntry[];
}

export interface FollowUpAnswer {
  question: string;
  answer: string;
}

/** Identity of the person filing the report, resolved server-side from the session. */
export interface BugReporter {
  id: string | number;
  email: string | null;
}

/** Request body for POST /api/bug-report/triage. */
export interface TriageRequest {
  description: string;
  context: BugReportContext;
}

/** Response from POST /api/bug-report/triage. */
export interface TriageResponse {
  questions: string[];
}

/** Request body for POST /api/bug-report. */
export interface SubmitRequest {
  description: string;
  answers: FollowUpAnswer[];
  context: BugReportContext;
  /** A PNG data URL (data:image/png;base64,...) or null when no screenshot was taken. */
  screenshot: string | null;
}

/** Response from POST /api/bug-report. */
export interface SubmitResponse {
  url: string;
  number: number;
}
