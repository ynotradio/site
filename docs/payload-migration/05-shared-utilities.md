# Chapter 5: Shared Utilities

[← Back to Index](./README.md)

---

## File Structure

```
payload/
├── src/
│   ├── collections/
│   │   ├── People.ts
│   │   ├── DJs.ts
│   │   ├── Artists.ts
│   │   ├── Venues.ts
│   │   ├── Concerts.ts
│   │   ├── Media.ts
│   │   └── index.ts
│   ├── endpoints/
│   │   ├── concerts.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── slugify.ts
│   │   └── index.ts
│   ├── payload.config.ts
│   └── server.ts
├── migrations/
│   ├── 001_initial_schema.sql
│   └── README.md
└── package.json

bin/
└── migrations/
    ├── importPeople.ts
    ├── importDJs.ts
    ├── importArtists.ts
    ├── importConcerts.ts
    └── shared/
        ├── payloadClient.ts
        ├── mediaImporter.ts
        ├── richTextConverter.ts
        ├── validation.ts
        ├── logger.ts
        └── upsert.ts
```

---

## Payload Client Utility

**File:** `bin/migrations/shared/payloadClient.ts`

```typescript
import payload from 'payload';
import dotenv from 'dotenv';

dotenv.config();

let isInitialized = false;

export async function getPayloadClient() {
  if (!isInitialized) {
    await payload.init({
      secret: process.env.PAYLOAD_SECRET!,
      mongoURL: process.env.DATABASE_URI!,
      local: true,
    });
    isInitialized = true;
  }
  return payload;
}

export async function closePayload() {
  // Cleanup if needed
}
```

---

## Upsert Pattern

**File:** `bin/migrations/shared/upsert.ts`

```typescript
import { Payload } from 'payload';

export async function upsertDocument(
  payload: Payload,
  collection: string,
  legacyId: number,
  data: any
): Promise<{ id: string; operation: 'created' | 'updated' }> {
  // Find existing document by legacyId
  const existing = await payload.find({
    collection,
    where: {
      legacyId: {
        equals: legacyId,
      },
    },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    // Update existing
    const doc = existing.docs[0];
    await payload.update({
      collection,
      id: doc.id,
      data: {
        ...data,
        legacyId,
        migratedAt: new Date(),
      },
    });
    return { id: doc.id, operation: 'updated' };
  } else {
    // Create new
    const newDoc = await payload.create({
      collection,
      data: {
        ...data,
        legacyId,
        migratedAt: new Date(),
      },
    });
    return { id: newDoc.id, operation: 'created' };
  }
}
```

---

## Rich Text Converter (HTML → TipTap)

**File:** `bin/migrations/shared/richTextConverter.ts`

```typescript
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

export function convertHTMLToTipTap(html: string): any {
  if (!html || html.trim() === '') {
    return null;
  }

  try {
    const json = generateJSON(html, [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ]);
    return json;
  } catch (error) {
    console.error('Error converting HTML to TipTap:', error);
    return null;
  }
}

// Alternative: HTML → Lexical
export function convertHTMLToLexical(html: string): any {
  // Use @lexical/html if using Lexical editor
  // Implementation depends on Lexical version
  throw new Error('Lexical converter not implemented');
}
```

**Install dependencies:**
```bash
yarn add @tiptap/core @tiptap/html @tiptap/starter-kit @tiptap/extension-link
```

---

## Media Importer

**File:** `bin/migrations/shared/mediaImporter.ts`

```typescript
import { Payload } from 'payload';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

export async function uploadMediaFromURL(
  payload: Payload,
  url: string,
  alt?: string
): Promise<string | null> {
  try {
    // Download image
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    // Create temp file
    const tempDir = '/tmp/media-imports';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filename = path.basename(new URL(url).pathname);
    const tempPath = path.join(tempDir, filename);
    const writer = fs.createWriteStream(tempPath);

    await pipeline(response.data, writer);

    // Upload to Payload
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: alt || '',
      },
      filePath: tempPath,
    });

    // Cleanup
    fs.unlinkSync(tempPath);

    return media.id;
  } catch (error) {
    console.error(`Failed to upload media from ${url}:`, error);
    return null;
  }
}
```

---

## Logger Utility

**File:** `bin/migrations/shared/logger.ts`

```typescript
export class MigrationLogger {
  private startTime: Date;
  private stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };
  private errors: Array<{ legacyId: number; error: string }> = [];

  constructor(private migrationName: string) {
    this.startTime = new Date();
    console.log(`\n=== ${migrationName} Migration Started ===`);
    console.log(`Start Time: ${this.startTime.toISOString()}\n`);
  }

  logCreated(legacyId: number, id: string) {
    this.stats.created++;
    console.log(`✓ Created: Legacy ID ${legacyId} → Payload ID ${id}`);
  }

  logUpdated(legacyId: number, id: string) {
    this.stats.updated++;
    console.log(`↻ Updated: Legacy ID ${legacyId} → Payload ID ${id}`);
  }

  logSkipped(legacyId: number, reason: string) {
    this.stats.skipped++;
    console.log(`⊘ Skipped: Legacy ID ${legacyId} - ${reason}`);
  }

  logFailed(legacyId: number, error: string) {
    this.stats.failed++;
    this.errors.push({ legacyId, error });
    console.error(`✗ Failed: Legacy ID ${legacyId} - ${error}`);
  }

  summary() {
    const endTime = new Date();
    const duration = (endTime.getTime() - this.startTime.getTime()) / 1000;

    console.log(`\n=== ${this.migrationName} Migration Summary ===`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Created: ${this.stats.created}`);
    console.log(`Updated: ${this.stats.updated}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Total: ${Object.values(this.stats).reduce((a, b) => a + b, 0)}`);

    if (this.errors.length > 0) {
      console.log(`\n=== Errors ===`);
      this.errors.forEach(({ legacyId, error }) => {
        console.error(`Legacy ID ${legacyId}: ${error}`);
      });
    }
  }

  generateReport(): string {
    const endTime = new Date();
    const duration = (endTime.getTime() - this.startTime.getTime()) / 1000;

    let report = `# ${this.migrationName} Migration Report\n\n`;
    report += `**Date:** ${endTime.toISOString()}\n`;
    report += `**Duration:** ${duration.toFixed(2)}s\n\n`;
    report += `## Summary\n`;
    report += `- Created: ${this.stats.created}\n`;
    report += `- Updated: ${this.stats.updated}\n`;
    report += `- Skipped: ${this.stats.skipped}\n`;
    report += `- Failed: ${this.stats.failed}\n`;
    report += `- Total: ${Object.values(this.stats).reduce((a, b) => a + b, 0)}\n\n`;

    if (this.errors.length > 0) {
      report += `## Errors\n\n`;
      report += `| Legacy ID | Error |\n`;
      report += `|-----------|-------|\n`;
      this.errors.forEach(({ legacyId, error }) => {
        report += `| ${legacyId} | ${error} |\n`;
      });
    }

    return report;
  }
}
```

---

## Validation Utility

**File:** `bin/migrations/shared/validation.ts`

```typescript
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateSlug(slug: string): boolean {
  const re = /^[a-z0-9-]+$/;
  return re.test(slug);
}

export function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRecord(
  record: any,
  rules: Record<string, (value: any) => string | null>
): ValidationResult {
  const errors: string[] = [];

  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(record[field]);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## Database Connection (MySQL Source)

**File:** `bin/migrations/shared/mysqlConnection.ts`

```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let connection: mysql.Connection | null = null;

export async function getMySQLConnection() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ynot_site',
    });
  }
  return connection;
}

export async function closeMySQLConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}
```

---

## Example Migration Script

**File:** `bin/migrations/importPeople.ts`

```typescript
import { getMySQLConnection, closeMySQLConnection } from './shared/mysqlConnection';
import { getPayloadClient, closePayload } from './shared/payloadClient';
import { upsertDocument } from './shared/upsert';
import { convertHTMLToTipTap } from './shared/richTextConverter';
import { uploadMediaFromURL } from './shared/mediaImporter';
import { MigrationLogger } from './shared/logger';
import { sanitizeSlug } from './shared/validation';

async function importPeople() {
  const logger = new MigrationLogger('People');
  
  try {
    const mysql = await getMySQLConnection();
    const payload = await getPayloadClient();

    // Query MySQL
    const [rows] = await mysql.query('SELECT * FROM people WHERE deleted != "y"');

    for (const row of rows as any[]) {
      try {
        // Convert bio HTML to TipTap
        const bio = row.bio ? convertHTMLToTipTap(row.bio) : null;

        // Upload photo if exists
        let photoId = null;
        if (row.photo_url) {
          photoId = await uploadMediaFromURL(payload, row.photo_url, row.name);
        }

        // Upsert document
        const result = await upsertDocument(payload, 'people', row.id, {
          name: row.name,
          slug: sanitizeSlug(row.slug || row.name),
          bio,
          photo: photoId,
        });

        if (result.operation === 'created') {
          logger.logCreated(row.id, result.id);
        } else {
          logger.logUpdated(row.id, result.id);
        }
      } catch (error: any) {
        logger.logFailed(row.id, error.message);
      }
    }

    logger.summary();

    // Save report
    const fs = require('fs');
    fs.writeFileSync(
      'docs/migrations/reports/people-migration-report.md',
      logger.generateReport()
    );

  } finally {
    await closeMySQLConnection();
    await closePayload();
  }
}

importPeople();
```

---

## NPM Scripts

**Add to `package.json`:**

```json
{
  "scripts": {
    "payload:dev": "cross-env PAYLOAD_CONFIG_PATH=payload/src/payload.config.ts payload dev",
    "payload:build": "cross-env PAYLOAD_CONFIG_PATH=payload/src/payload.config.ts payload build",
    "payload:migrate": "cross-env PAYLOAD_CONFIG_PATH=payload/src/payload.config.ts payload migrate",
    "import:people": "tsx bin/migrations/importPeople.ts",
    "import:djs": "tsx bin/migrations/importDJs.ts",
    "import:artists": "tsx bin/migrations/importArtists.ts",
    "import:concerts": "tsx bin/migrations/importConcerts.ts",
    "import:all": "yarn import:people && yarn import:djs && yarn import:artists && yarn import:concerts"
  }
}
```

---

## Environment Variables

**File:** `.env.local`

```bash
# Payload
PAYLOAD_SECRET=your-secret-key
DATABASE_URI=postgres://user:pass@neon.host/dbname

# Legacy MySQL (for migrations)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ynot_site

# Media Storage (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Next Steps

- Use these utilities in [Migration Tasks](./04-migration-tasks.md)
- Review [Architecture Decisions](./02-architecture-decisions.md) for patterns
- Check [Success Criteria](./07-success-criteria.md) for validation
