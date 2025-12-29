# Chapter 12: Cloudinary Integration

[← Back to Index](./README.md)

---

## Overview

This chapter provides a detailed guide for integrating Cloudinary as the media storage solution for the Payload CMS migration. Cloudinary will handle all image uploads, transformations, and delivery for both the development and production environments.

---

## Table of Contents

1. [Why Cloudinary?](#why-cloudinary)
2. [Architecture Overview](#architecture-overview)
3. [Getting Started](#getting-started)
4. [Payload Configuration](#payload-configuration)
5. [Development Environment Setup](#development-environment-setup)
6. [Production Environment Setup](#production-environment-setup)
7. [Migration Strategy](#migration-strategy)
8. [Code Examples](#code-examples)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)
12. [Cost Considerations](#cost-considerations)

---

## Why Cloudinary?

**Key Benefits:**

| Feature | Benefit |
|---------|---------|
| **Automatic Image Optimization** | Converts images to optimal formats (WebP, AVIF) based on browser support |
| **On-the-Fly Transformations** | Resize, crop, and transform images via URL parameters without storing multiple versions |
| **CDN Delivery** | Global content delivery network for fast image loading |
| **Storage Management** | Centralized storage with automatic backups |
| **AI-Powered Features** | Auto-tagging, background removal, content-aware cropping |
| **Free Tier** | 25 GB storage + 25 GB bandwidth/month at no cost |
| **Payload CMS Integration** | Native support via `@payloadcms/plugin-cloud-storage` |

**Alternatives Considered:**
- **AWS S3:** More complex setup, requires separate CloudFront CDN configuration
- **Vercel Blob:** Limited free tier, vendor lock-in
- **Local Filesystem:** Not suitable for serverless deployments (Netlify Functions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Payload CMS Admin UI                     │
│              (Netlify Functions + Admin Panel)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Upload Request
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Payload Media Collection                        │
│         (@payloadcms/plugin-cloud-storage)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Upload via Cloudinary SDK
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Cloudinary API                            │
│              (Upload, Transform, Deliver)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Store Media
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudinary Storage + CDN                        │
│          (Global distribution, automatic backups)            │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Deliver Images
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    End Users                                 │
│              (Website visitors, mobile apps)                 │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**

1. **Upload:** User uploads image via Payload Admin → Cloudinary API
2. **Store:** Cloudinary stores original + generates metadata
3. **Reference:** Payload stores Cloudinary URL + public_id in PostgreSQL
4. **Deliver:** Frontend requests image → Cloudinary CDN serves optimized version

---

## Getting Started

### Step 1: Create Cloudinary Account

**Development Environment:**
1. Visit [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account
3. Choose account name (e.g., `ynotradio-dev`)
4. Navigate to **Dashboard** → **Account Details**
5. Copy credentials:
   - **Cloud Name:** `ynotradio-dev`
   - **API Key:** `123456789012345`
   - **API Secret:** `abcdefghijklmnopqrstuvwxyz123456`

**Production Environment:**
1. Create a separate Cloudinary account for production
2. Use account name: `ynotradio-prod` (or main account `ynotradio`)
3. Copy production credentials

**Why Separate Accounts?**
- **Isolation:** Dev uploads don't affect production storage
- **Billing:** Track usage separately for dev/prod
- **Security:** Leaked dev credentials don't compromise production
- **Testing:** Safe to delete/reset dev storage during development

### Step 2: Install Cloudinary Plugin

```bash
cd payload/
npm install @payloadcms/plugin-cloud-storage
npm install cloudinary
```

**Dependencies:**
- `@payloadcms/plugin-cloud-storage`: Payload plugin for external storage
- `cloudinary`: Official Cloudinary Node.js SDK

---

## Payload Configuration

### Main Configuration File

**File:** `payload/src/payload.config.ts`

```typescript
import { buildConfig } from 'payload/config';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { cloudStorage } from '@payloadcms/plugin-cloud-storage';
import { Media } from './collections/Media';

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'users',
  },
  collections: [
    Media,
    // ... other collections
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  plugins: [
    cloudStorage({
      collections: {
        media: {
          adapter: 'cloudinary',
          disableLocalStorage: true, // Don't store files locally
          generateFileURL: ({ filename }) => {
            // Construct Cloudinary URL
            return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${filename}`;
          },
        },
      },
    }),
  ],
  typescript: {
    outputFile: './src/payload-types.ts',
  },
  graphQL: {
    schemaOutputFile: './src/generated-schema.graphql',
  },
});
```

### Media Collection Configuration

**File:** `payload/src/collections/Media.ts`

```typescript
import { CollectionConfig } from 'payload/types';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media', // Fallback for local dev (if not using Cloudinary)
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 576,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'centre',
      },
      {
        name: 'feature',
        width: 1200,
        height: 630, // Social media sharing (1.91:1 ratio)
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
    // Cloudinary handles transformations via cloudStorage plugin
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Authenticated users can upload
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility and SEO',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption displayed below the image',
      },
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photo credit / attribution',
      },
    },
    {
      name: 'cloudinaryPublicId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Cloudinary public ID for reference',
      },
    },
    {
      name: 'legacyUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Original URL (for migrated images)',
      },
    },
    {
      name: 'legacyId',
      type: 'number',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Original MySQL media ID',
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Date migrated from legacy system',
      },
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Log upload events
        if (operation === 'create') {
          req.payload.logger.info(`Media uploaded: ${doc.filename} (ID: ${doc.id})`);
        }
      },
    ],
  },
};
```

---

## Development Environment Setup

### Environment Variables

**File:** `payload/.env.local`

```bash
# Database
DATABASE_URI=postgresql://user:pass@localhost:5432/ynot_dev
PAYLOAD_SECRET=your-secret-key-dev

# Payload
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Cloudinary (Development)
CLOUDINARY_CLOUD_NAME=ynotradio-dev
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_UPLOAD_PRESET=ynotradio_dev_preset # Optional: unsigned uploads

# Node Environment
NODE_ENV=development
```

### Cloudinary Upload Preset (Development)

**Purpose:** Control upload behavior (transformations, format conversions)

**Setup Steps:**
1. Log in to Cloudinary Dashboard
2. Navigate to **Settings** → **Upload** → **Upload Presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name:** `ynotradio_dev_preset`
   - **Signing mode:** Signed (requires API secret)
   - **Folder:** `dev/uploads` (organize uploads by environment)
   - **Format:** Auto (Cloudinary decides optimal format)
   - **Quality:** Auto (balance quality vs. file size)
   - **Responsive breakpoints:** Enable (generates multiple sizes)
5. Save preset

### Local Development Testing

```bash
# Start Payload CMS
cd payload/
npm run dev

# Admin UI accessible at http://localhost:3000/admin
# Test upload:
# 1. Navigate to Media collection
# 2. Click "Create New"
# 3. Upload an image
# 4. Verify Cloudinary URL in response
```

**Verify Upload:**
1. Check Cloudinary Dashboard → **Media Library** → `dev/uploads` folder
2. Confirm image appears in Payload Admin
3. Test image URL in browser:
   ```
   https://res.cloudinary.com/ynotradio-dev/image/upload/dev/uploads/my-image.jpg
   ```

---

## Production Environment Setup

### Environment Variables

**File:** `payload/.env.production` (or Netlify Environment Variables)

```bash
# Database (Neon PostgreSQL)
DATABASE_URI=postgresql://user:pass@neon-tech-host/ynot_prod
PAYLOAD_SECRET=your-secret-key-production-use-strong-value

# Payload
PAYLOAD_PUBLIC_SERVER_URL=https://cms.ynotradio.net

# Cloudinary (Production)
CLOUDINARY_CLOUD_NAME=ynotradio
CLOUDINARY_API_KEY=987654321098765
CLOUDINARY_API_SECRET=zyxwvutsrqponmlkjihgfedcba987654
CLOUDINARY_UPLOAD_PRESET=ynotradio_prod_preset

# Node Environment
NODE_ENV=production

# Monitoring (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Cloudinary Upload Preset (Production)

**Configuration Differences:**
- **Folder:** `prod/uploads`
- **Backup:** Enable (retain deleted images for 30 days)
- **Moderation:** Enable manual approval for sensitive content (optional)
- **Allowed formats:** JPG, PNG, GIF, WebP, AVIF
- **Max file size:** 10 MB (adjust as needed)

### Netlify Deployment

**File:** `netlify.toml`

```toml
[build]
  command = "cd payload && npm run build"
  publish = "payload/dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/payload/:splat"
  status = 200

[[redirects]]
  from = "/admin"
  to = "/.netlify/functions/payload/admin"
  status = 200

[[redirects]]
  from = "/admin/*"
  to = "/.netlify/functions/payload/admin/:splat"
  status = 200
```

**Environment Variables in Netlify:**
1. Navigate to **Site settings** → **Environment variables**
2. Add all production environment variables
3. Mark sensitive variables (API secrets) as **Secret**
4. Deploy and verify

---

## Migration Strategy

### Migrating Existing Images to Cloudinary

**Context:**
- Current images stored in legacy locations:
  - Google Drive URLs
  - Imgur URLs
  - Local filesystem (`/images`, `/imgs`)
  - MySQL BLOB fields (rare)
  - External hotlinks

**Goal:** Upload all existing images to Cloudinary and update references in Payload collections.

---

### Migration Script Architecture

```
bin/migrations/
├── importMedia.ts           # Main migration script
├── shared/
│   ├── mediaImporter.ts     # Cloudinary upload logic
│   ├── urlFetcher.ts        # Download images from URLs
│   ├── validation.ts        # Image validation
│   └── logger.ts            # Progress logging
```

---

### Media Importer Utility

**File:** `bin/migrations/shared/mediaImporter.ts`

```typescript
import { Payload } from 'payload';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface MediaImportResult {
  success: boolean;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  payloadMediaId?: string;
  error?: string;
}

/**
 * Import an image from a legacy URL to Cloudinary + Payload
 */
export async function importImageFromUrl(
  payload: Payload,
  legacyUrl: string,
  metadata: {
    legacyId?: number;
    alt?: string;
    caption?: string;
    credit?: string;
  }
): Promise<MediaImportResult> {
  try {
    // Step 1: Download image from legacy URL
    const imageBuffer = await downloadImage(legacyUrl);
    
    // Step 2: Validate image
    if (!isValidImage(imageBuffer)) {
      return { success: false, error: 'Invalid image format' };
    }

    // Step 3: Generate unique filename
    const filename = generateFilename(legacyUrl, imageBuffer);
    
    // Step 4: Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(imageBuffer, filename);
    
    // Step 5: Create Payload Media record
    const payloadMedia = await payload.create({
      collection: 'media',
      data: {
        alt: metadata.alt || `Migrated image ${metadata.legacyId || ''}`,
        caption: metadata.caption,
        credit: metadata.credit,
        cloudinaryPublicId: cloudinaryResult.public_id,
        legacyUrl,
        legacyId: metadata.legacyId,
        migratedAt: new Date().toISOString(),
        filename: cloudinaryResult.secure_url,
        mimeType: cloudinaryResult.format,
        filesize: cloudinaryResult.bytes,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      },
    });

    return {
      success: true,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      payloadMediaId: payloadMedia.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000, // 30 second timeout
    maxContentLength: 10 * 1024 * 1024, // 10 MB max
  });
  return Buffer.from(response.data);
}

/**
 * Validate image format
 */
function isValidImage(buffer: Buffer): boolean {
  // Check magic numbers for common image formats
  const signatures = {
    jpg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    gif: [0x47, 0x49, 0x46],
    webp: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  };

  for (const [format, signature] of Object.entries(signatures)) {
    if (buffer.slice(0, signature.length).equals(Buffer.from(signature))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate unique filename based on content hash
 */
function generateFilename(legacyUrl: string, buffer: Buffer): string {
  const hash = createHash('md5').update(buffer).digest('hex');
  const ext = path.extname(legacyUrl) || '.jpg';
  return `migrated-${hash}${ext}`;
}

/**
 * Upload buffer to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  filename: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'migrated', // Organize migrated images
        public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
        resource_type: 'image',
        overwrite: false, // Don't overwrite if already exists
        format: 'auto', // Auto-detect format
        quality: 'auto:good', // Balance quality vs size
        fetch_format: 'auto', // Serve WebP/AVIF if supported
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Upload local file to Cloudinary
 */
export async function importImageFromFile(
  payload: Payload,
  filePath: string,
  metadata: {
    legacyId?: number;
    alt?: string;
    caption?: string;
    credit?: string;
  }
): Promise<MediaImportResult> {
  try {
    const buffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    
    if (!isValidImage(buffer)) {
      return { success: false, error: 'Invalid image format' };
    }

    const cloudinaryResult = await uploadToCloudinary(buffer, filename);
    
    const payloadMedia = await payload.create({
      collection: 'media',
      data: {
        alt: metadata.alt || filename,
        caption: metadata.caption,
        credit: metadata.credit,
        cloudinaryPublicId: cloudinaryResult.public_id,
        legacyUrl: `file://${filePath}`,
        legacyId: metadata.legacyId,
        migratedAt: new Date().toISOString(),
        filename: cloudinaryResult.secure_url,
        mimeType: cloudinaryResult.format,
        filesize: cloudinaryResult.bytes,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      },
    });

    return {
      success: true,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      payloadMediaId: payloadMedia.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

### Main Import Script

**File:** `bin/migrations/importMedia.ts`

```typescript
import { getPayloadClient } from './shared/payloadClient';
import { importImageFromUrl, importImageFromFile } from './shared/mediaImporter';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

interface LegacyImage {
  id: number;
  url: string;
  alt?: string;
  caption?: string;
  source?: string;
}

async function main() {
  console.log('🚀 Starting media migration to Cloudinary...\n');

  // Initialize Payload client
  const payload = await getPayloadClient();

  // Connect to legacy MySQL database
  const mysqlConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'ynot_site',
  });

  try {
    // Fetch all images from legacy database
    const [images] = await mysqlConnection.query<any[]>(`
      SELECT 
        id,
        image_url as url,
        alt_text as alt,
        caption,
        'database' as source
      FROM media
      WHERE image_url IS NOT NULL
      ORDER BY id ASC
    `);

    console.log(`📊 Found ${images.length} images to migrate\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: number; url: string; error: string }> = [];

    // Process each image
    for (const [index, image] of images.entries()) {
      console.log(`[${index + 1}/${images.length}] Processing: ${image.url}`);

      // Check if already migrated
      const existing = await payload.find({
        collection: 'media',
        where: { legacyId: { equals: image.id } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        console.log(`  ⏭️  Already migrated (Payload ID: ${existing.docs[0].id})\n`);
        successCount++;
        continue;
      }

      // Import image
      const result = await importImageFromUrl(payload, image.url, {
        legacyId: image.id,
        alt: image.alt,
        caption: image.caption,
        credit: image.source,
      });

      if (result.success) {
        console.log(`  ✅ Success: ${result.cloudinaryUrl}`);
        console.log(`     Payload ID: ${result.payloadMediaId}\n`);
        successCount++;
      } else {
        console.log(`  ❌ Error: ${result.error}\n`);
        errorCount++;
        errors.push({ id: image.id, url: image.url, error: result.error || 'Unknown' });
      }

      // Rate limiting (Cloudinary free tier: 500 uploads/day)
      await sleep(100); // 100ms delay between uploads
    }

    // Summary
    console.log('\n📈 Migration Summary:');
    console.log(`   Total: ${images.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);

    // Write error report
    if (errors.length > 0) {
      const errorReport = errors
        .map((e) => `${e.id},${e.url},"${e.error}"`)
        .join('\n');
      fs.writeFileSync(
        './migration-errors.csv',
        `id,url,error\n${errorReport}`
      );
      console.log('📄 Error report saved to: migration-errors.csv\n');
    }
  } finally {
    await mysqlConnection.end();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

---

### Running the Migration

```bash
# Set environment variables
export DATABASE_URI=postgresql://...
export CLOUDINARY_CLOUD_NAME=ynotradio
export CLOUDINARY_API_KEY=...
export CLOUDINARY_API_SECRET=...
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=...
export MYSQL_DATABASE=ynot_site

# Run migration
cd bin/migrations
npx tsx importMedia.ts

# Expected output:
# 🚀 Starting media migration to Cloudinary...
# 📊 Found 523 images to migrate
# [1/523] Processing: https://drive.google.com/...
#   ✅ Success: https://res.cloudinary.com/ynotradio/...
#   Payload ID: 63f4a1b2c3d4e5f6g7h8i9j0
# ...
```

---

## Code Examples

### Querying Media via REST API

```bash
# Get all media
GET https://cms.ynotradio.net/api/media

# Get single media with details
GET https://cms.ynotradio.net/api/media/63f4a1b2c3d4e5f6g7h8i9j0

# Search by alt text
GET https://cms.ynotradio.net/api/media?where[alt][contains]=concert

# Filter migrated images
GET https://cms.ynotradio.net/api/media?where[legacyId][exists]=true
```

### Using Media in Frontend (PHP Example)

```php
<?php
// Fetch concert with artist photo from Payload API
$apiUrl = 'https://cms.ynotradio.net/api/concerts/123?depth=2';
$response = file_get_contents($apiUrl);
$concert = json_decode($response, true);

// Artist photo is a Cloudinary URL
$artistPhoto = $concert['artist']['photo']['filename'];

// Display with transformations
$thumbnailUrl = str_replace(
    '/upload/',
    '/upload/w_400,h_300,c_fill,f_auto,q_auto/',
    $artistPhoto
);

echo "<img src='$thumbnailUrl' alt='{$concert['artist']['photo']['alt']}' />";
?>
```

### Using Media in Frontend (React Example)

```tsx
import React from 'react';

interface Concert {
  id: string;
  date: string;
  artist: {
    name: string;
    photo: {
      filename: string; // Cloudinary URL
      alt: string;
      width: number;
      height: number;
    };
  };
}

function ConcertCard({ concert }: { concert: Concert }) {
  // Generate responsive image URL
  const imageUrl = concert.artist.photo.filename.replace(
    '/upload/',
    '/upload/w_768,h_576,c_fill,f_auto,q_auto/'
  );

  return (
    <div className="concert-card">
      <img
        src={imageUrl}
        alt={concert.artist.photo.alt}
        width="768"
        height="576"
        loading="lazy"
      />
      <h2>{concert.artist.name}</h2>
      <p>{new Date(concert.date).toLocaleDateString()}</p>
    </div>
  );
}
```

### Cloudinary URL Transformations

**Base URL:**
```
https://res.cloudinary.com/ynotradio/image/upload/v1234567890/prod/uploads/my-image.jpg
```

**Thumbnail (400x300, fill):**
```
https://res.cloudinary.com/ynotradio/image/upload/w_400,h_300,c_fill,f_auto,q_auto/v1234567890/prod/uploads/my-image.jpg
```

**Hero Image (1600x900, WebP):**
```
https://res.cloudinary.com/ynotradio/image/upload/w_1600,h_900,c_fill,f_webp,q_auto:good/v1234567890/prod/uploads/my-image.jpg
```

**Social Media (1200x630, crop face):**
```
https://res.cloudinary.com/ynotradio/image/upload/w_1200,h_630,c_fill,g_face,f_auto,q_auto/v1234567890/prod/uploads/my-image.jpg
```

**Transformation Parameters:**
- `w_`: Width
- `h_`: Height
- `c_`: Crop mode (fill, fit, scale, crop, etc.)
- `g_`: Gravity (face, center, auto, etc.)
- `f_`: Format (auto, webp, jpg, png)
- `q_`: Quality (auto, auto:good, auto:best, 80, etc.)

[Full Cloudinary Transformation Reference](https://cloudinary.com/documentation/image_transformation_reference)

---

## Testing

### Manual Testing Checklist

**Development Environment:**
- [ ] Upload image via Payload Admin → Media collection
- [ ] Verify image appears in Cloudinary Dashboard → `dev/uploads` folder
- [ ] Test image URL in browser
- [ ] Create Artist with photo → Verify relationship works
- [ ] Query Artist via GraphQL → Confirm photo URL returned
- [ ] Delete image in Payload → Verify removed from Cloudinary

**Production Environment:**
- [ ] Upload image via production Payload Admin
- [ ] Verify image in Cloudinary → `prod/uploads` folder
- [ ] Test Cloudinary CDN performance (global latency)
- [ ] Verify Netlify Functions handle uploads correctly
- [ ] Test concurrent uploads (simulate multiple users)
- [ ] Monitor Cloudinary bandwidth usage in Dashboard

### Automated Tests

**File:** `payload/src/collections/Media.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import payload from 'payload';
import path from 'path';
import fs from 'fs';

describe('Media Collection with Cloudinary', () => {
  beforeAll(async () => {
    await payload.init({
      secret: process.env.PAYLOAD_SECRET!,
      local: true,
    });
  });

  afterAll(async () => {
    // Cleanup test uploads
  });

  it('should upload image to Cloudinary', async () => {
    const testImagePath = path.resolve(__dirname, '../../test/fixtures/test-image.jpg');
    const testImage = fs.readFileSync(testImagePath);

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Test image',
      },
      file: {
        data: testImage,
        mimetype: 'image/jpeg',
        name: 'test-image.jpg',
        size: testImage.length,
      },
    });

    expect(media.id).toBeDefined();
    expect(media.filename).toContain('cloudinary.com');
    expect(media.cloudinaryPublicId).toBeDefined();
  });

  it('should prevent duplicate uploads', async () => {
    // Test idempotency
  });

  it('should generate thumbnails', async () => {
    // Test that imageSizes are generated
  });
});
```

---

## Troubleshooting

### Common Issues

**1. Upload Fails with "Invalid API Key"**

**Cause:** Incorrect Cloudinary credentials or missing environment variables.

**Solution:**
```bash
# Verify environment variables
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET

# Test connection
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
cloudinary.api.ping().then(console.log).catch(console.error);
"
```

**2. Images Not Displaying**

**Cause:** CORS issues or incorrect URL format.

**Solution:**
- Verify Cloudinary URL format: `https://res.cloudinary.com/{cloud_name}/image/upload/...`
- Check browser console for CORS errors
- Ensure `CLOUDINARY_CLOUD_NAME` matches account

**3. Migration Script Times Out**

**Cause:** Large images or slow network.

**Solution:**
- Increase timeout: `axios.get(url, { timeout: 60000 })`
- Add retry logic with exponential backoff
- Batch uploads: Process 10-20 images at a time

**4. Cloudinary Rate Limit Exceeded**

**Cause:** Uploading too fast on free tier (500 uploads/day).

**Error:** `429 Too Many Requests`

**Solution:**
- Add delay between uploads: `await sleep(200)`
- Upgrade to Cloudinary Plus plan ($99/month, 50k uploads/day)
- Split migration over multiple days

**5. PostgreSQL Connection Pool Exhausted**

**Cause:** Too many concurrent database connections during migration.

**Solution:**
```typescript
// Limit concurrency
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent operations

const promises = images.map((image) =>
  limit(() => importImageFromUrl(payload, image.url, { ... }))
);

await Promise.all(promises);
```

---

## Best Practices

### Security

1. **Never commit API secrets to git:**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   echo ".env.production" >> .gitignore
   ```

2. **Use signed uploads in production:**
   - Prevents unauthorized uploads
   - Configured via `cloudStorage` plugin

3. **Restrict upload formats:**
   ```typescript
   upload: {
     mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
   }
   ```

4. **Set file size limits:**
   ```typescript
   upload: {
     maxFileSize: 10 * 1024 * 1024, // 10 MB
   }
   ```

### Performance

1. **Use Cloudinary transformations:**
   - Don't store multiple image sizes locally
   - Generate on-the-fly via URL parameters

2. **Enable auto format/quality:**
   ```typescript
   format: 'auto',
   quality: 'auto:good',
   ```

3. **Lazy load images:**
   ```html
   <img src="..." loading="lazy" />
   ```

4. **Use CDN caching:**
   - Cloudinary CDN automatically caches images
   - Cache headers set by default

### Organization

1. **Use folders for environment separation:**
   - `dev/uploads` → Development
   - `prod/uploads` → Production
   - `migrated` → Legacy imports

2. **Tag images for easy filtering:**
   ```typescript
   cloudinary.uploader.upload(file, {
     tags: ['concert', 'featured', '2025'],
   });
   ```

3. **Use descriptive public IDs:**
   ```typescript
   public_id: `${collection}/${slug}/${Date.now()}`,
   // Example: artists/the-beatles/1640000000000
   ```

### Backup

1. **Enable Cloudinary backup:**
   - Dashboard → **Settings** → **Upload** → **Backup**
   - Keeps deleted files for 30-60 days

2. **Export media metadata regularly:**
   ```bash
   # Export Payload Media collection to JSON
   curl https://cms.ynotradio.net/api/media?limit=1000 > media-backup.json
   ```

3. **Use Cloudinary's backup addon (paid):**
   - Automatic backups to S3/Google Cloud Storage

---

## Cost Considerations

### Cloudinary Pricing Tiers

| Tier | Storage | Bandwidth | Uploads | Cost |
|------|---------|-----------|---------|------|
| **Free** | 25 GB | 25 GB/month | 500/day | $0 |
| **Plus** | 120 GB | 120 GB/month | 50k/day | $99/month |
| **Advanced** | 500 GB | 500 GB/month | 200k/day | $224/month |

**Estimated Y-Not Radio Usage:**
- **Current Images:** ~2,000 files (~5 GB)
- **Monthly Uploads:** ~100 new images (~200 MB)
- **Monthly Bandwidth:** ~50 GB (assuming 10k page views/month)

**Recommendation:**
- **Start with Free tier** during development/migration
- **Monitor usage** via Cloudinary Dashboard
- **Upgrade to Plus ($99/month)** if bandwidth exceeds 25 GB

### Cost Optimization

1. **Use transformations instead of storing multiple sizes:**
   - Saves storage space
   - Cloudinary generates sizes on-demand

2. **Set appropriate quality:**
   - `q_auto:good` (recommended) → 50-70% file size reduction
   - `q_auto:best` → Higher quality, larger files

3. **Cache aggressively:**
   - Cloudinary CDN caches images
   - Frontend caching reduces requests

4. **Audit unused images:**
   ```bash
   # List images not referenced in Payload
   # (Run periodically to clean up orphaned files)
   ```

---

## Next Steps

1. **Set up Cloudinary accounts** (dev + production)
2. **Install Cloudinary plugin** in Payload project
3. **Configure Media collection** with cloud storage
4. **Test uploads** in development environment
5. **Run migration script** to import legacy images
6. **Deploy to production** and verify
7. **Monitor usage** via Cloudinary Dashboard

---

## Related Documentation

- [Chapter 2: Architecture Decisions](./02-architecture-decisions.md) - Upload collection patterns
- [Chapter 3: Core Data Models](./03-core-data-models.md) - Media collection schema
- [Chapter 4: Migration Tasks](./04-migration-tasks.md) - Task 3 (Media collection) + Task 9 (Image migration)
- [Chapter 5: Shared Utilities](./05-shared-utilities.md) - Migration patterns
- [Chapter 8: Quick Reference](./08-quick-reference.md) - Environment variables
- [Chapter 11: Capacity Planning](./11-capacity-planning.md) - Storage estimates

**External Resources:**
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Payload Cloud Storage Plugin](https://payloadcms.com/docs/plugins/cloud-storage)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)

---

[← Back to Index](./README.md)
