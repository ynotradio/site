# Chapter 5: Shared Utilities

[← Back to Index](./README.md)

---

## File Structure

```
bin/migrations/
├── shared/
│   ├── index.ts           # Barrel exports
│   ├── imageUploader.ts   # Upload images to Sanity
│   ├── richTextConverter.ts # HTML → Portable Text
│   ├── validation.ts      # Record validation
│   ├── logger.ts          # Consistent logging
│   └── upsert.ts          # Upsert by _legacyId
├── config.ts              # Environment config (existing)
├── database.ts            # MySQL connection (existing)
├── sanity.ts              # Sanity client (existing)
├── importDeejays.ts       # DJ migration (existing)
├── importAds.ts           # Ad migration
├── importConcerts.ts      # Concert migration
└── ...
```

---

## Upsert Pattern

```typescript
// bin/migrations/shared/upsert.ts
import type { SanityClient } from '@sanity/client';

export async function upsertDocument(
  client: SanityClient,
  documentType: string,
  legacyId: number,
  data: Record<string, unknown>
): Promise<{ created: boolean; updated: boolean; id: string }> {
  // 1. Query for existing document by _legacyId
  const existing = await client.fetch(
    `*[_type == $documentType && _legacyId == $legacyId][0]`,
    { documentType, legacyId }
  );

  if (existing) {
    // 2. Update existing document
    const result = await client.patch(existing._id).set(data).commit();
    return { created: false, updated: true, id: result._id };
  } else {
    // 3. Create new document
    const result = await client.create({
      _type: documentType,
      _legacyId: legacyId,
      _migratedAt: new Date().toISOString(),
      ...data,
    });
    return { created: true, updated: false, id: result._id };
  }
}
```

---

## Image Uploader Pattern

```typescript
// bin/migrations/shared/imageUploader.ts
import type { SanityClient } from '@sanity/client';

export async function uploadImage(
  client: SanityClient,
  imageUrl: string,
  filename?: string
): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } } | null> {
  try {
    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const asset = await client.assets.upload('image', Buffer.from(buffer), {
      filename: filename || imageUrl.split('/').pop(),
    });

    return {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
    };
  } catch (error) {
    console.error(`Failed to upload image: ${imageUrl}`, error);
    return null;
  }
}
```

---

## Validation Pattern

```typescript
// bin/migrations/shared/validation.ts

export interface ValidationError {
  legacyId: number;
  field: string;
  error: string;
}

export function validateRecord(
  record: Record<string, unknown>,
  legacyId: number,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of requiredFields) {
    if (!record[field]) {
      errors.push({ legacyId, field, error: 'Required field missing' });
    }
  }

  return errors;
}
```

---

## Logger Pattern

```typescript
// bin/migrations/shared/logger.ts

export function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error);
}

export function logSummary(
  total: number,
  created: number,
  updated: number,
  skipped: number,
  errors: number
): void {
  log(`\n--- Migration Summary ---`);
  log(`Total records: ${total}`);
  log(`Created: ${created}`);
  log(`Updated: ${updated}`);
  log(`Skipped: ${skipped}`);
  log(`Errors: ${errors}`);
}
```
