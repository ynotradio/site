'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import { useAsyncSearch } from './useAsyncSearch';
import { SearchField } from './SearchField';
import { createRecord, createCdOfTheWeek } from './utils';
import './CdOfTheWeekWizardClient.css';

export const CdOfTheWeekWizardClient: React.FC = () => {
  const { setStepNav } = useStepNav();

  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [reviewText, setReviewText] = useState('');

  const artistSearch = useAsyncSearch('artists');
  const reviewerSearch = useAsyncSearch('people');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStepNav([
      { label: 'CDs of the Week', url: '/admin/collections/cdoftheweek' },
      { label: 'New CD of the Week + Album' },
    ]);
  }, [setStepNav]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!title.trim()) { setError('Album title is required'); return; }
      if (!artistSearch.selected) { setError('Artist is required — search and select one above'); return; }
      if (!reviewDate) { setError('Review date is required'); return; }
      if (!reviewText.trim()) { setError('Review text is required'); return; }

      setSubmitting(true);
      try {
        const recordId = await createRecord(
          title.trim(),
          artistSearch.selected.id,
          label,
          releaseDate,
        );
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
    [title, artistSearch, label, releaseDate, reviewDate, reviewText, reviewerSearch],
  );

  return (
    <Gutter>
      <div className="cdotw-wizard">
        <div className="cdotw-wizard__header">
          <h1 className="cdotw-wizard__title">New CD of the Week + Album</h1>
          <p className="cdotw-wizard__description">
            Creates the album record and CD of the Week entry in one step. To use an
            existing album, go to{' '}
            <a href="/admin/collections/cdoftheweek/create">Create CD of the Week</a>{' '}
            and select it from the record field.
          </p>
        </div>

        {error && <div className="cdotw-wizard__error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="cdotw-wizard__section">
            <h2 className="cdotw-wizard__section-title">Album Details</h2>

            <div className="cdotw-wizard__field">
              <label className="cdotw-wizard__label cdotw-wizard__label--required" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="cdotw-wizard__input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Album title"
                required
              />
            </div>

            <SearchField
              label="Artist"
              required
              search={artistSearch}
              placeholder="Search for an artist…"
              hint="Type to search existing artists. To add a new artist, create them in Artists first."
            />

            <div className="cdotw-wizard__row">
              <div className="cdotw-wizard__field">
                <label className="cdotw-wizard__label" htmlFor="label">
                  Label
                </label>
                <input
                  id="label"
                  type="text"
                  className="cdotw-wizard__input"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Record label"
                />
              </div>

              <div className="cdotw-wizard__field">
                <label className="cdotw-wizard__label" htmlFor="releaseDate">
                  Release Date
                </label>
                <input
                  id="releaseDate"
                  type="date"
                  className="cdotw-wizard__input"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="cdotw-wizard__section">
            <h2 className="cdotw-wizard__section-title">CD of the Week</h2>

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

          <div className="cdotw-wizard__footer">
            <a href="/admin/collections/cdoftheweek" className="cdotw-wizard__cancel-link">
              Cancel
            </a>
            <button type="submit" className="cdotw-wizard__submit-btn" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create CD of the Week + Album'}
            </button>
          </div>
        </form>
      </div>
    </Gutter>
  );
};
