import { useCallback, useState } from 'react';

import type { FollowUpAnswer, SubmitResponse, TriageResponse } from '../types';
import { captureContext } from './captureContext';
import { captureScreenshot } from './captureScreenshot';

export type BugReportStep = 'describe' | 'questions' | 'submitting' | 'success' | 'error';

export interface UseBugReportResult {
  step: BugReportStep;
  description: string;
  setDescription: (value: string) => void;
  questions: string[];
  answers: Record<string, string>;
  setAnswer: (question: string, value: string) => void;
  screenshot: string | null;
  capturingScreenshot: boolean;
  takeScreenshot: (ignore?: HTMLElement | null) => Promise<void>;
  setScreenshot: (value: string) => void;
  removeScreenshot: () => void;
  loadingFollowUps: boolean;
  continueToFollowUps: () => Promise<void>;
  submit: () => Promise<void>;
  result: SubmitResponse | null;
  error: string | null;
  reset: () => void;
}

const TRIAGE_ENDPOINT = '/api/bug-report/triage';
const SUBMIT_ENDPOINT = '/api/bug-report';

// AI follow-up questions are gated off by default. Set
// NEXT_PUBLIC_BUG_REPORT_AI_ENABLED=true (alongside the server-side flag) to
// enable them; otherwise we skip the triage round-trip entirely.
const aiEnabled = (): boolean => process.env.NEXT_PUBLIC_BUG_REPORT_AI_ENABLED === 'true';

export const useBugReport = (): UseBugReportResult => {
  const [step, setStep] = useState<BugReportStep>('describe');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setAnswer = useCallback((question: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  }, []);

  const takeScreenshot = useCallback(async (ignore?: HTMLElement | null) => {
    setCapturingScreenshot(true);
    try {
      const shot = await captureScreenshot({ ignore });
      setScreenshot(shot);
    } finally {
      setCapturingScreenshot(false);
    }
  }, []);

  const replaceScreenshot = useCallback((value: string) => setScreenshot(value), []);

  const removeScreenshot = useCallback(() => setScreenshot(null), []);

  const continueToFollowUps = useCallback(async () => {
    if (!description.trim()) {
      return;
    }
    // Skip the AI round-trip when follow-ups are gated off.
    if (!aiEnabled()) {
      setQuestions([]);
      setStep('questions');
      return;
    }
    setLoadingFollowUps(true);
    setError(null);
    try {
      const response = await fetch(TRIAGE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, context: captureContext() }),
      });
      if (response.ok) {
        const data = (await response.json()) as TriageResponse;
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
      } else {
        setQuestions([]);
      }
    } catch {
      // Follow-ups are optional; move on without them.
      setQuestions([]);
    } finally {
      setLoadingFollowUps(false);
      setStep('questions');
    }
  }, [description]);

  const submit = useCallback(async () => {
    if (!description.trim()) {
      return;
    }
    setStep('submitting');
    setError(null);

    const followUpAnswers: FollowUpAnswer[] = questions.map((question) => ({
      question,
      answer: answers[question] ?? '',
    }));

    try {
      const response = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          answers: followUpAnswers,
          context: captureContext(),
          screenshot,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Request failed (${response.status}).`);
        setStep('error');
        return;
      }

      const data = (await response.json()) as SubmitResponse;
      setResult(data);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to file bug report.');
      setStep('error');
    }
  }, [description, questions, answers, screenshot]);

  const reset = useCallback(() => {
    setStep('describe');
    setDescription('');
    setQuestions([]);
    setAnswers({});
    setScreenshot(null);
    setResult(null);
    setError(null);
    setLoadingFollowUps(false);
    setCapturingScreenshot(false);
  }, []);

  return {
    step,
    description,
    setDescription,
    questions,
    answers,
    setAnswer,
    screenshot,
    capturingScreenshot,
    takeScreenshot,
    setScreenshot: replaceScreenshot,
    removeScreenshot,
    loadingFollowUps,
    continueToFollowUps,
    submit,
    result,
    error,
    reset,
  };
};
