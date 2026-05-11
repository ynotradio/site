'use client';

import React from 'react';
import { useAsyncSearch } from './useAsyncSearch';
import type { SearchItem } from './useAsyncSearch';

interface SearchFieldProps {
  label: string;
  required?: boolean;
  search: ReturnType<typeof useAsyncSearch>;
  placeholder: string;
  hint?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  label,
  required,
  search,
  placeholder,
  hint,
}) => (
  <div className="cdotw-wizard__field">
    <label className={`cdotw-wizard__label${required ? ' cdotw-wizard__label--required' : ''}`}>
      {label}
    </label>
    {search.selected ? (
      <div className="cdotw-wizard__selected-value">
        <span>{search.selected.name}</span>
        <button
          type="button"
          className="cdotw-wizard__clear-btn"
          onClick={search.clear}
          aria-label={`Clear ${label}`}
        >
          ✕
        </button>
      </div>
    ) : (
      <div className="cdotw-wizard__search-wrapper">
        <input
          type="text"
          className="cdotw-wizard__input"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {(search.results.length > 0 || (search.query.length > 0 && !search.isSearching)) && (
          <div className="cdotw-wizard__search-results">
            {search.isSearching && (
              <div className="cdotw-wizard__search-hint">Searching…</div>
            )}
            {!search.isSearching && search.results.length === 0 && search.query.length > 0 && (
              <div className="cdotw-wizard__search-hint">No results found</div>
            )}
            {search.results.map((item: SearchItem) => (
              <button
                key={item.id}
                type="button"
                className="cdotw-wizard__search-result"
                onClick={() => search.select(item)}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    )}
    {hint && <div className="cdotw-wizard__hint">{hint}</div>}
  </div>
);
