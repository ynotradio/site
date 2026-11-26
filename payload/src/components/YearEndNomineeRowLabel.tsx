'use client';

import React, { useEffect, useState } from 'react';
import { useRowLabel } from '@payloadcms/ui';

type Doc = { id?: number | string; displayName?: string; titlePlain?: string; name?: string };
type Relation = Doc | number | string | null | undefined;

type RowData = {
  customLabel?: string | null;
  song?: Relation;
  record?: Relation;
  artist?: Relation;
  concert?: Relation;
  voteCount?: number | null;
};

const COLLECTIONS = [
  ['song', 'songs'],
  ['record', 'records'],
  ['artist', 'artists'],
  ['concert', 'concerts'],
] as const;

const labelCache = new Map<string, string>();

const nameOf = (doc: Doc): string | null => doc.displayName || doc.titlePlain || doc.name || null;

const YearEndNomineeRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<RowData>();
  const picked = COLLECTIONS.map(([field, collection]) => ({
    collection,
    value: data?.[field],
  })).find(({ value }) => value);
  const doc = typeof picked?.value === 'object' && picked.value ? picked.value : null;
  const id = doc ? doc.id : picked?.value;
  const inlineName = doc && nameOf(doc);
  const key = picked && id !== undefined ? `${picked.collection}/${id}` : null;
  const [, rerender] = useState(0);
  // Read through the cache every render so the label follows the row's
  // current link, not the one it had when the label first mounted.
  const fetched = key ? (labelCache.get(key) ?? null) : null;

  useEffect(() => {
    if (!key || inlineName || labelCache.has(key)) {
      return undefined;
    }
    let cancelled = false;
    fetch(`/api/${key}?depth=0`)
      .then((response) => (response.ok ? response.json() : null))
      .then((fetchedDoc: Doc | null) => {
        const name = fetchedDoc && nameOf(fetchedDoc);
        if (name) labelCache.set(key, name);
        if (!cancelled && name) rerender((n) => n + 1);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key, inlineName]);

  const label = data?.customLabel?.trim() || inlineName || fetched;
  const votes = data?.voteCount
    ? ` (${data.voteCount} ${data.voteCount === 1 ? 'vote' : 'votes'})`
    : '';
  return <>{`${label || `Nominee ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`}${votes}`}</>;
};

export default YearEndNomineeRowLabel;
