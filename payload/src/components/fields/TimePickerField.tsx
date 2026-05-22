'use client';

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import type { TextFieldClientProps } from 'payload';
import { useField, FieldLabel, mergeFieldStyles } from '@payloadcms/ui';
import './TimePickerField.css';

type TimePickerFieldProps = TextFieldClientProps;

// All 15-min slots across the day, formatted as display strings
const ALL_TIMES: string[] = Array.from({ length: 96 }, (_, i) => {
  const h24 = Math.floor(i / 4);
  const m = (i % 4) * 15;
  const ampm = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
});

// Parse stored "HH:MM" or "HH:MM:SS" → display string like "9:00am"
function stored24hToDisplay(value: string): string {
  if (!value) return '';
  const [hStr = '0', mStr = '0'] = value.split(':');
  const h24 = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const ampm = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

// Parse user input like "9:00am", "9am", "900am", "21:00" → "HH:MM" or null
function parseInput(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s/g, '');
  if (!s) return null;

  // Detect am/pm suffix
  const hasAm = s.endsWith('am');
  const hasPm = s.endsWith('pm');
  const timePart = hasAm || hasPm ? s.slice(0, -2) : s;

  let h: number;
  let m = 0;

  if (timePart.includes(':')) {
    const [hStr, mStr] = timePart.split(':');
    h = parseInt(hStr, 10);
    m = parseInt(mStr, 10) || 0;
  } else if (timePart.length <= 2) {
    h = parseInt(timePart, 10);
  } else if (timePart.length === 3) {
    // e.g. "930" → 9:30
    h = parseInt(timePart[0], 10);
    m = parseInt(timePart.slice(1), 10);
  } else {
    // e.g. "1030" → 10:30
    h = parseInt(timePart.slice(0, 2), 10);
    m = parseInt(timePart.slice(2), 10);
  }

  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;

  // If no am/pm suffix, treat as 24h if h > 12, else ambiguous — keep as-is
  if (hasPm && h < 12) h += 12;
  if (hasAm && h === 12) h = 0;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const TimePickerField: React.FC<TimePickerFieldProps> = ({ field, path }) => {
  const label = typeof field?.label === 'string' ? field.label : undefined;
  const required = field?.required ?? false;
  const { value, setValue } = useField<string>({ path });

  const [inputText, setInputText] = useState(() => stored24hToDisplay(value || ''));
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  // True only while the user is actively typing — suppresses prefix filtering on open
  const [isEditing, setIsEditing] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeOptionRef = useRef<HTMLButtonElement>(null);

  // Keep display in sync when external value changes (e.g. form reset)
  useEffect(() => {
    setInputText(stored24hToDisplay(value || ''));
  }, [value]);

  const filtered = useMemo(() => {
    if (!isEditing) return ALL_TIMES;
    const q = inputText.trim().toLowerCase().replace(/\s/g, '');
    if (!q) return ALL_TIMES;
    return ALL_TIMES.filter((t) => t.startsWith(q));
  }, [inputText, isEditing]);

  const selectedDisplay = stored24hToDisplay(value || '');

  const commit = useCallback(
    (display: string) => {
      const stored = parseInput(display);
      if (stored) {
        setValue(stored);
        setInputText(stored24hToDisplay(stored));
      }
      setOpen(false);
      setFocusedIdx(-1);
      setIsEditing(false);
    },
    [setValue],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setIsEditing(true);
    setOpen(true);
    setFocusedIdx(0);
  };

  const handleInputFocus = () => {
    setIsEditing(false);
    setOpen(true);
    // Scroll to the currently selected time in the full list
    setFocusedIdx(ALL_TIMES.findIndex((t) => t === selectedDisplay));
    inputRef.current?.select();
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if focus moves into the dropdown
    if (wrapRef.current?.contains(e.relatedTarget as Node)) return;
    commit(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        setFocusedIdx(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIdx >= 0 && filtered[focusedIdx]) {
        commit(filtered[focusedIdx]);
      } else {
        commit(inputText);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      commit(inputText);
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (open && focusedIdx >= 0 && activeOptionRef.current?.scrollIntoView) {
      activeOptionRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIdx, open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const inputId = `tp-${path}`;
  const fieldStyles = useMemo(() => mergeFieldStyles(field), [field]);

  return (
    <div className="tp-wrap" ref={wrapRef} style={fieldStyles}>
      {label && <FieldLabel htmlFor={inputId} label={label} required={required} />}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        className={`tp-input${open ? ' tp-input--open' : ''}`}
        value={inputText}
        placeholder="9:00am"
        aria-label={label ?? 'Time'}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
      />
      {open && filtered.length > 0 && (
        <div className="tp-dropdown" ref={listRef} role="listbox">
          {filtered.map((t, i) => (
            <button
              key={t}
              type="button"
              role="option"
              aria-selected={t === selectedDisplay}
              ref={i === focusedIdx ? activeOptionRef : undefined}
              className={[
                'tp-option',
                t === selectedDisplay ? 'tp-option--selected' : '',
                i === focusedIdx ? 'tp-option--focused' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={(e) => {
                // Prevent blur before commit
                e.preventDefault();
                commit(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimePickerField;
