'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import type { Data } from 'payload';
import { InlineCollectionFormClient } from '../../utils/InlineCollectionFormClient';
import { useAsyncSearch } from './useAsyncSearch';
import { SearchField } from './SearchField';
import { createCdOfTheWeek } from './utils';
import './CdOfTheWeekWizardClient.css';

export const CdOfTheWeekWizardClient: React.FC = () => {
  const { setStepNav } = useStepNav();

  const [recordId, setRecordId] = useState<number | null>(null);
  const [recordTitle, setRecordTitle] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewerSearch = useAsyncSearch('people');

  useEffect(() => {
    setStepNav([
      { label: 'CDs of the Week', url: '/admin/collections/cdoftheweek' },
      { label: 'New CD of the Week + Album' },
    ]);
  }, [setStepNav]);

  const handleRecordCreated = useCallback((doc: Data) => {
    setRecordId(doc.id as number);
    setRecordTitle((doc.title as string) || '');
  }, []);

  const handleCreateCdOfTheWeek = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!recordId) {
        setError('Record not created yet');
        return;
      }
      if (!reviewDate) {
        setError('Review date is required');
        return;
      }
      if (!reviewText.trim()) {
        setError('Review text is required');
        return;
      }

      setSubmitting(true);
      try {
        const cdId = await createCdOfTheWeek(
          recordId,
          reviewDate,
          reviewText,
          reviewerSearch.selected?.id ?? null,
        );
        window.location.href = `/admin/collections/cdoftheweek/${cdId}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setSubmitting(false);
      }
    },
    [recordId, reviewDate, reviewText, reviewerSearch],
  );

  return (
    <Gutter>
      <div className="cdotw-wizard">
        <div className="cdotw-wizard__header">
          <h1 className="cdotw-wizard__title">New CD of the Week + Album</h1>
          <p className="cdotw-wizard__description">
            Creates the album record and CD of the Week entry in two steps. To use an existing
            album, go to <a href="/admin/collections/cdoftheweek/create">Create CD of the Week</a>{' '}
            and select it from the record field.
          </p>
        </div>

        {error && (
          <div className="cdotw-wizard__error" role="alert">
            {error}
          </div>
        )}

        {!recordId ? (
          <InlineCollectionFormClient
            collectionSlug="records"
            title="Step 1: Create Album"
            description="Fill in the album details using the form below."
            submitLabel="Create Album"
            onSuccess={handleRecordCreated}
          />
        ) : (
          <div className="cdotw-wizard__section">
            <h2 className="cdotw-wizard__section-title">Step 2: Create CD of the Week</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--theme-elevation-500)' }}>
              Album <strong>{recordTitle}</strong> created. Now fill in the review details below.
            </p>

            <form onSubmit={handleCreateCdOfTheWeek} noValidate>
              <div className="cdotw-wizard__row">
                <div className="cdotw-wizard__field">
                  <label
                    className="cdotw-wizard__label cdotw-wizard__label--required"
                    htmlFor="reviewDate"
                  >
                    Review Date
                  </label>
                  <input
                    id="reviewDate"
                    type="date"
                    className="cdotw-wizard__input"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    required
                  />
                </div>

                <SearchField
                  label="Reviewer"
                  search={reviewerSearch}
                  placeholder="Search for a reviewer…"
                  hint="Optional. Type to search people."
                />
              </div>

              <div className="cdotw-wizard__field">
                <label
                  className="cdotw-wizard__label cdotw-wizard__label--required"
                  htmlFor="reviewText"
                >
                  Review
                </label>
                <textarea
                  id="reviewText"
                  className="cdotw-wizard__textarea"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write the review here…"
                  required
                />
                <div className="cdotw-wizard__hint">
                  Plain text. You can add rich formatting after saving via the edit page.
                </div>
              </div>

              <div className="cdotw-wizard__footer">
                <button
                  type="button"
                  className="cdotw-wizard__cancel-link"
                  onClick={() => setRecordId(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--theme-elevation-400)',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button type="submit" className="cdotw-wizard__submit-btn" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create CD of the Week'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Gutter>
  );
};
