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

  const handleRecordCreated = useCallback(
    async (doc: Data) => {
      setError(null);

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
          doc.id as number,
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
    [reviewDate, reviewText, reviewerSearch],
  );

  return (
    <Gutter>
      <div className="cdotw-wizard">
        <div className="cdotw-wizard__header">
          <h1 className="cdotw-wizard__title">New CD of the Week + Album</h1>
          <p className="cdotw-wizard__description">
            Creates the album record and CD of the Week entry at once. To use an existing album, go
            to <a href="/admin/collections/cdoftheweek/create">Create CD of the Week</a> and select
            it from the record field.
          </p>
        </div>

        {error && (
          <div className="cdotw-wizard__error" role="alert">
            {error}
          </div>
        )}

        <InlineCollectionFormClient
          collectionSlug="records"
          title="Album Details"
          description="Fill in the album details and review information below."
          submitLabel={submitting ? 'Creating…' : 'Create CD of the Week + Album'}
          onSuccess={handleRecordCreated}
        >
          <div className="cdotw-wizard__section">
            <h2 className="cdotw-wizard__section-title">CD of the Week Details</h2>

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
          </div>
        </InlineCollectionFormClient>
      </div>
    </Gutter>
  );
};
