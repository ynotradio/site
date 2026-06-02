'use client';

import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import type { Data } from 'payload';
import { InlineCollectionFormClient } from '../../utils/InlineCollectionFormClient';
import { useAsyncSearch } from './useAsyncSearch';
import { SearchField } from './SearchField';
import { createCdOfTheWeek } from './utils';
import { CdotwReviewField } from './CdotwReviewField';
import { recordInlineCollectionConfig } from './recordCollectionConfig';
import './CdOfTheWeekWizardClient.css';

export const CdOfTheWeekWizardClient: React.FC = () => {
  const { setStepNav } = useStepNav();

  const [reviewDate, setReviewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewerSearch = useAsyncSearch('people');
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const reviewValueRef = useRef<unknown>(null);

  const hasReviewContent = useCallback((review: unknown): boolean => {
    if (!review) return false;
    if (typeof review !== 'object') return true;
    return JSON.stringify(review) !== '{}';
  }, []);

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

      const reviewText = reviewValueRef.current;
      if (!hasReviewContent(reviewText)) {
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
    [hasReviewContent, reviewDate, reviewerSearch],
  );

  const handleSubmit = useCallback(() => {
    setError(null);

    if (!reviewDate) {
      setError('Review date is required');
      return;
    }

    if (!hasReviewContent(reviewValueRef.current)) {
      setError('Review text is required');
      return;
    }

    if (submitBtnRef.current) {
      submitBtnRef.current.click();
    }
  }, [hasReviewContent, reviewDate]);

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

        <div className="cdotw-wizard__action-row">
          <button
            type="button"
            className="cdotw-wizard__submit-btn"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Creating…' : 'Create CD of the Week + Album'}
          </button>
        </div>

        <div className="cdotw-wizard__layout">
          <aside className="cdotw-wizard__record-sidebar" aria-label="New record form">
            <h2 className="cdotw-wizard__sidebar-title">New Record</h2>
            <p className="cdotw-wizard__sidebar-description">
              Create the album record first, then this wizard will generate the CD of the Week
              entry.
            </p>
            <InlineCollectionFormClient
              collectionSlug="records"
              collectionConfig={recordInlineCollectionConfig}
              excludeFields={['legacyId', 'migratedAt']}
              onSuccess={handleRecordCreated}
              disableSubmit
              disableGutter
              layout="stacked"
            >
              <button
                ref={submitBtnRef}
                type="submit"
                className="cdotw-wizard__hidden-submit"
                aria-hidden="true"
                tabIndex={-1}
              />
            </InlineCollectionFormClient>
          </aside>

          <section className="cdotw-wizard__main">
            <h2 className="cdotw-wizard__main-title">CD of the Week Details</h2>
            <div className="cdotw-wizard__row">
              <div className="cdotw-wizard__field">
                <label
                  className="cdotw-wizard__label cdotw-wizard__label--required"
                  htmlFor="reviewDate"
                >
                  Date
                </label>
                <input
                  id="reviewDate"
                  type="date"
                  className="cdotw-wizard__input"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  required
                />
                <div className="cdotw-wizard__hint">Review date</div>
              </div>

              <SearchField
                id="reviewerSearch"
                label="Reviewer"
                search={reviewerSearch}
                placeholder="Search for a reviewer…"
                hint="Who wrote the review? Select from People."
              />
            </div>

            <div className="cdotw-wizard__field">
              <span className="cdotw-wizard__label cdotw-wizard__label--required">Review</span>
              <CdotwReviewField valueRef={reviewValueRef} />
              <div className="cdotw-wizard__hint">The review text shown on the website.</div>
            </div>
          </section>
        </div>
      </div>
    </Gutter>
  );
};
