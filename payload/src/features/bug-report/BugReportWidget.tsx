'use client';

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';

import { useBugReport } from './client/useBugReport';
import { ScreenshotAnnotator } from './ScreenshotAnnotator';
import './BugReportWidget.css';

export interface BugReportWidgetProps {
  /** Start with the dialog open — used by stories and tests. */
  defaultOpen?: boolean;
}

export const BugReportWidget: React.FC<BugReportWidgetProps> = ({ defaultOpen = false }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [annotating, setAnnotating] = useState(false);
  const report = useBugReport();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen && !dialog.open) {
      // showModal may be missing or a throwing stub (jsdom); fall back to the
      // plain open attribute so the dialog still renders.
      try {
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      } catch {
        dialog.setAttribute('open', '');
      }
    } else if (!isOpen && dialog.open) {
      try {
        dialog.close();
      } catch {
        dialog.removeAttribute('open');
      }
    }
  }, [isOpen]);

  const open = useCallback(() => {
    report.reset();
    setIsOpen(true);
  }, [report]);

  const close = useCallback(() => {
    setIsOpen(false);
    setAnnotating(false);
    report.reset();
  }, [report]);

  const saveAnnotation = useCallback(
    (dataUrl: string) => {
      report.setScreenshot(dataUrl);
      setAnnotating(false);
    },
    [report],
  );

  const onTakeScreenshot = useCallback(async () => {
    // Exclude the widget (button + dialog) so it doesn't appear in the capture.
    await report.takeScreenshot(rootRef.current);
  }, [report]);

  return (
    <div ref={rootRef} className="bug-report-root">
      <button
        type="button"
        className="bug-report-launcher"
        onClick={open}
        aria-label="Report a bug"
        title="Report a bug"
      >
        🐞
      </button>

      <dialog
        ref={dialogRef}
        className="bug-report-dialog"
        onClose={close}
        aria-label="Report a bug"
      >
        {annotating && report.screenshot ? (
          <div className="bug-report-form">
            <header className="bug-report-header">
              <h2>Annotate screenshot</h2>
              <button
                type="button"
                className="bug-report-close"
                onClick={() => setAnnotating(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>
            <ScreenshotAnnotator
              image={report.screenshot}
              onSave={saveAnnotation}
              onCancel={() => setAnnotating(false)}
            />
          </div>
        ) : (
          <form method="dialog" className="bug-report-form" onSubmit={(e) => e.preventDefault()}>
            <header className="bug-report-header">
              <h2>Report a bug</h2>
              <button type="button" className="bug-report-close" onClick={close} aria-label="Close">
                ✕
              </button>
            </header>

            {report.step === 'describe' && (
              <div className="bug-report-body">
                <label htmlFor="bug-report-description">What went wrong?</label>
                <textarea
                  id="bug-report-description"
                  rows={5}
                  value={report.description}
                  placeholder="Describe what you were doing and what happened…"
                  onChange={(e) => report.setDescription(e.target.value)}
                />

                <div className="bug-report-screenshot">
                  {report.screenshot ? (
                    <div className="bug-report-screenshot-preview">
                      {/* Data-URL preview of the just-captured screenshot; next/image
                        is not appropriate for an in-memory data URI. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={report.screenshot} alt="Captured screenshot" />
                      <div className="bug-report-screenshot-buttons">
                        <button
                          type="button"
                          className="bug-report-secondary"
                          onClick={() => setAnnotating(true)}
                        >
                          ✏️ Annotate
                        </button>
                        <button
                          type="button"
                          className="bug-report-secondary"
                          onClick={report.removeScreenshot}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="bug-report-secondary"
                      onClick={onTakeScreenshot}
                      disabled={report.capturingScreenshot}
                    >
                      {report.capturingScreenshot ? 'Capturing…' : '📸 Attach screenshot'}
                    </button>
                  )}
                </div>

                <p className="bug-report-hint">
                  We&apos;ll automatically include the page URL, your browser details, and recent
                  console logs.
                </p>

                <div className="bug-report-actions">
                  <button type="button" className="bug-report-secondary" onClick={close}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bug-report-primary"
                    disabled={!report.description.trim() || report.loadingFollowUps}
                    onClick={report.continueToFollowUps}
                  >
                    {report.loadingFollowUps ? 'Thinking…' : 'Continue'}
                  </button>
                </div>
              </div>
            )}

            {report.step === 'questions' && (
              <div className="bug-report-body">
                {report.questions.length > 0 ? (
                  <>
                    <p className="bug-report-hint">
                      A few quick questions to help pin this down (optional):
                    </p>
                    {report.questions.map((question) => (
                      <div key={question} className="bug-report-question">
                        <label>{question}</label>
                        <textarea
                          rows={2}
                          value={report.answers[question] ?? ''}
                          onChange={(e) => report.setAnswer(question, e.target.value)}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="bug-report-hint">Looks clear — ready to file this report.</p>
                )}

                <div className="bug-report-actions">
                  <button type="button" className="bug-report-secondary" onClick={close}>
                    Cancel
                  </button>
                  <button type="button" className="bug-report-primary" onClick={report.submit}>
                    Submit report
                  </button>
                </div>
              </div>
            )}

            {report.step === 'submitting' && (
              <div className="bug-report-body bug-report-status">
                <p>Filing your report…</p>
              </div>
            )}

            {report.step === 'success' && report.result && (
              <div className="bug-report-body bug-report-status">
                <p>✅ Thanks! Your report was filed.</p>
                <a href={report.result.url} target="_blank" rel="noreferrer">
                  View issue #{report.result.number}
                </a>
                <div className="bug-report-actions">
                  <button type="button" className="bug-report-primary" onClick={close}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {report.step === 'error' && (
              <div className="bug-report-body bug-report-status">
                <p className="bug-report-error">⚠️ {report.error}</p>
                <div className="bug-report-actions">
                  <button type="button" className="bug-report-secondary" onClick={close}>
                    Close
                  </button>
                  <button type="button" className="bug-report-primary" onClick={report.submit}>
                    Try again
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </dialog>
    </div>
  );
};

export default BugReportWidget;
