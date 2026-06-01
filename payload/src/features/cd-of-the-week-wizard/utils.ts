type LexicalDocument = {
  root: {
    type: 'root';
    format: string;
    indent: number;
    version: number;
    direction: 'ltr' | 'rtl' | null;
    children: Array<Record<string, unknown>>;
  };
};

function isLexicalDocument(value: unknown): value is LexicalDocument {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { root?: unknown };
  if (!maybe.root || typeof maybe.root !== 'object') return false;
  const root = maybe.root as { type?: unknown; children?: unknown };
  return root.type === 'root' && Array.isArray(root.children);
}

export function textToLexical(text: string): LexicalDocument {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: lines.map((line) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: line.trim(),
            version: 1,
          },
        ],
      })),
    },
  };
}

function normalizeReviewValue(reviewValue: unknown): LexicalDocument {
  if (isLexicalDocument(reviewValue)) {
    return reviewValue;
  }

  if (typeof reviewValue === 'string') {
    return textToLexical(reviewValue);
  }

  return textToLexical('');
}

async function createRecord(
  title: string,
  artistId: number,
  label: string,
  releaseDate: string,
): Promise<number> {
  const payload: Record<string, unknown> = { title, artist: artistId };
  if (label.trim()) payload.label = label.trim();
  if (releaseDate) payload.releaseDate = releaseDate;

  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { errors?: { message: string }[] }).errors?.[0]?.message
      ?? 'Failed to create album record';
    throw new Error(msg);
  }

  const data = await res.json();
  return data.doc?.id ?? data.id;
}

async function createCdOfTheWeek(
  recordId: number,
  reviewDate: string,
  reviewText: unknown,
  reviewerId: number | null,
): Promise<number> {
  const payload: Record<string, unknown> = {
    record: recordId,
    date: reviewDate,
    review: normalizeReviewValue(reviewText),
  };
  if (reviewerId !== null) payload.reviewer = reviewerId;

  const res = await fetch('/api/cdoftheweek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { errors?: { message: string }[] }).errors?.[0]?.message
      ?? 'Album was created but failed to create CD of the Week entry';
    throw new Error(msg);
  }

  const data = await res.json();
  return data.doc?.id ?? data.id;
}

export { createRecord, createCdOfTheWeek };
