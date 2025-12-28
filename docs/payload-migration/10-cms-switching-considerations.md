# Chapter 10: CMS Switching Considerations

[← Back to Index](./README.md)

---

## Overview

While the relational database continuity (MySQL → PostgreSQL) offers significant advantages, **switching from Sanity to Payload** introduces its own complexities. This chapter highlights areas that would require additional consideration and effort if transitioning from an already-started Sanity migration to Payload CMS.

---

## 1. Schema Redefinition

### Sanity Schema (Already Defined)

```typescript
// studio/schemaTypes/artist.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'artist',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
    }),
    defineField({
      name: 'bio',
      type: 'array',
      of: [{ type: 'block' }],  // Portable Text
    }),
    defineField({
      name: 'photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'person' }] }],
    }),
  ],
});
```

### Payload Collection (Must Redefine)

```typescript
// payload/src/collections/Artists.ts
import { CollectionConfig } from 'payload/types';

export const Artists: CollectionConfig = {
  slug: 'artists',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      hooks: {
        beforeValidate: [
          ({ value, data }) => value || slugify(data.name),
        ],
      },
    },
    {
      name: 'bio',
      type: 'richText',
      editor: lexicalEditor(),  // Different editor
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',  // Different approach
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,  // Different syntax
    },
  ],
};
```

**Effort Required:**
- 🔴 **High**: All schemas must be rewritten (15-20 collections)
- Manual conversion of field types
- Different syntax for relationships
- Different approach to rich text
- Different upload handling

**Mitigation:**
- Create conversion tool (Sanity schema → Payload collection)
- Start with simple collections first
- Validate each collection thoroughly

---

## 2. Rich Text Format Conversion

### Sanity: Portable Text (Proprietary)

```json
{
  "_type": "block",
  "children": [
    { "_type": "span", "text": "This is " },
    {
      "_type": "span",
      "text": "bold text",
      "marks": ["strong"]
    }
  ],
  "markDefs": [
    {
      "_key": "abc123",
      "_type": "link",
      "href": "https://example.com"
    }
  ]
}
```

### Payload: TipTap/Lexical (Open Standard)

**TipTap JSON:**
```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "This is " },
    {
      "type": "text",
      "text": "bold text",
      "marks": [{ "type": "bold" }]
    }
  ]
}
```

**Effort Required:**
- 🟡 **Medium**: Must convert existing rich text content
- Different JSON structure
- Different handling of marks and links
- Custom block types require mapping

**Conversion Challenges:**

| Sanity Feature | Payload Equivalent | Complexity |
|----------------|-------------------|------------|
| Portable Text blocks | TipTap/Lexical nodes | Medium |
| Custom marks | Custom marks/extensions | Medium |
| Inline objects (e.g., buttons) | Custom inline nodes | High |
| Annotations | Link marks with attrs | Low |
| Custom blocks (e.g., code) | Custom block extensions | High |

**Mitigation:**
- Use `@portabletext/to-html` to convert to HTML first
- Use `@tiptap/html` to convert HTML to TipTap
- Test conversions on sample content
- Manually review complex content (code blocks, embeds)

---

## 3. Media Assets Migration

### Sanity: Hosted Asset Pipeline

**Current State (if already migrated):**
- Images uploaded to Sanity CDN
- Automatic image optimization
- Hotspot/crop data stored
- URLs: `https://cdn.sanity.io/images/project/dataset/id-WxH.jpg`

**Payload Migration:**
```typescript
// Must re-upload to new storage
import { uploadMediaFromURL } from './shared/mediaImporter';

// Download from Sanity, upload to Cloudinary/S3
for (const asset of sanityAssets) {
  const sanityUrl = `https://cdn.sanity.io/images/${asset._id}.jpg`;
  const payloadId = await uploadMediaFromURL(payload, sanityUrl);
  
  // Update references
  await updateArtistPhoto(legacyId, payloadId);
}
```

**Effort Required:**
- 🔴 **High**: Re-download and re-upload all images
- Set up new cloud storage (Cloudinary, S3, etc.)
- Regenerate thumbnails and variants
- Update all references to new URLs

**Challenges:**
- ⚠️ Bandwidth costs (downloading from Sanity, uploading to new storage)
- ⚠️ Potential image quality loss (re-encoding)
- ⚠️ Hotspot/crop data not preserved
- ⚠️ CDN URL changes (frontend updates required)

**Mitigation:**
- Use bulk download scripts
- Configure cloud storage before migration
- Test image quality on sample set
- Update frontend to use new CDN URLs

---

## 4. Existing Sanity Studio Customization

### Sanity Studio Customizations (Already Built)

**Example: Custom Input Component**
```typescript
// studio/components/CustomSlugInput.tsx
import { TextInput } from '@sanity/ui';

export function CustomSlugInput(props) {
  return (
    <TextInput
      {...props}
      onChange={(e) => props.onChange(slugify(e.target.value))}
    />
  );
}
```

**Example: Custom Document Actions**
```typescript
// studio/actions/publishAndNotify.ts
export function publishAndNotify(props) {
  return {
    label: 'Publish & Notify',
    onHandle: async () => {
      await props.publish();
      await sendNotification();
    },
  };
}
```

### Payload Admin Customizations (Must Rebuild)

**Payload uses different APIs:**
```typescript
// payload/src/components/CustomSlugField.tsx
import { useField } from 'payload/components/forms';

export function CustomSlugField({ path }) {
  const { value, setValue } = useField({ path });
  
  return (
    <input
      value={value}
      onChange={(e) => setValue(slugify(e.target.value))}
    />
  );
}
```

**Payload hooks for custom actions:**
```typescript
// payload/src/collections/Artists.ts
export const Artists: CollectionConfig = {
  slug: 'artists',
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          await sendNotification(doc);
        }
      },
    ],
  },
};
```

**Effort Required:**
- 🔴 **High**: All custom Studio features must be rebuilt
- Different component libraries
- Different hooks/lifecycle APIs
- Different UI framework (React in both, but different patterns)

**Mitigation:**
- Inventory all custom Studio features
- Prioritize essential customizations
- Defer non-critical features to Phase 2

---

## 5. Content Editor Training

### Sanity Studio (Already Familiar)

Content editors have learned:
- Sanity Studio UI/UX
- Portable Text editor
- Reference selection UI
- Image cropping/hotspot tools
- Publishing workflow
- Custom actions and widgets

### Payload Admin (New Learning Curve)

Content editors must learn:
- Payload Admin UI (different layout)
- TipTap/Lexical editor (different controls)
- Relationship selection (different UI)
- Upload workflow (different process)
- Publishing workflow (potentially different)
- New custom features

**Effort Required:**
- 🟡 **Medium**: Training sessions required
- Documentation updates needed
- Onboarding materials
- Support during transition period

**Mitigation:**
- Create side-by-side comparison docs
- Record tutorial videos
- Schedule hands-on training sessions
- Provide quick reference guides

---

## 6. API Client Changes

### Sanity Client (Already Integrated)

**PHP Frontend:**
```php
// src/lib/SanityClient.php
$client = new SanityClient([
  'projectId' => 'abc123',
  'dataset' => 'production',
  'token' => 'token',
  'apiVersion' => '2023-05-03',
]);

$concerts = $client->fetch('
  *[_type == "concert" && date >= $date] | order(date asc) {
    date,
    "artist": artist->{ name, photo },
    "venue": venue->{ name, city }
  }
', ['date' => date('Y-m-d')]);
```

### Payload API (Must Reimplement)

**PHP Frontend:**
```php
// src/lib/PayloadClient.php
$client = new PayloadClient('https://api.ynotradio.net');

$concerts = $client->get('/api/concerts', [
  'where[date][greater_than_equals]' => date('Y-m-d'),
  'sort' => 'date',
  'depth' => 2,
  'limit' => 10,
]);

// Different response structure
foreach ($concerts['docs'] as $concert) {
  echo $concert['artist']['name'];
}
```

**Effort Required:**
- 🟡 **Medium**: Rewrite all API calls
- Different query syntax (REST vs GROQ)
- Different response structure
- Different authentication

**Mitigation:**
- Create adapter layer (Sanity-like API on top of Payload)
- Use GraphQL instead of REST (closer to GROQ)
- Gradual migration with feature flags

---

## 7. GROQ Queries → SQL/GraphQL

### Sanity: GROQ Queries (Already Written)

```groq
// Get concerts with artist and venue
*[_type == "concert" && date >= $date] | order(date asc) {
  _id,
  date,
  "artist": artist->{ name, slug, "photo": photo.asset->url },
  "venue": venue->{ name, city },
  ticketUrl
}

// Get artists with concert count
*[_type == "artist"] {
  name,
  "concertCount": count(*[_type == "concert" && references(^._id)])
} | order(concertCount desc)

// Get Top 11 results
*[_type == "top11Result" && contest._ref == $contestId][0] {
  placements[] {
    rank,
    song->{ title },
    artist->{ name }
  }
}
```

### Payload: GraphQL/SQL (Must Rewrite)

**GraphQL:**
```graphql
query GetConcerts($date: DateTime!) {
  Concerts(
    where: { date: { greater_than_equals: $date } }
    sort: "date"
  ) {
    docs {
      id
      date
      artist {
        name
        slug
        photo { url }
      }
      venue {
        name
        city
      }
      ticketUrl
    }
  }
}
```

**SQL (for complex queries):**
```sql
-- Get artists with concert count
SELECT 
  a.name,
  COUNT(c.id) AS concert_count
FROM artists a
LEFT JOIN concerts c ON a.id = c.artist_id
GROUP BY a.id
ORDER BY concert_count DESC;
```

**Effort Required:**
- 🟡 **Medium**: Rewrite all queries
- Learn GraphQL or SQL (depending on approach)
- Different query patterns
- Test query performance

**Mitigation:**
- Create query conversion guide (GROQ → GraphQL)
- Use GraphQL for most queries (closer to GROQ)
- Use SQL for complex analytics

---

## 8. Deployment Infrastructure

### Sanity (Already Deployed)

**Current Setup:**
- Sanity Studio hosted by Sanity (https://ynotradio.sanity.studio)
- Automatic SSL, CDN, scaling
- Zero server management
- Pay-as-you-go pricing

### Payload (Self-Hosted on Netlify)

**New Setup Required:**
- Netlify Functions for API
- Neon PostgreSQL (separate service)
- Custom domain configuration
- SSL certificate management
- Environment variable management
- Build pipeline setup
- Monitoring and logging setup

**Effort Required:**
- 🟡 **Medium**: Infrastructure setup and configuration
- Learn Netlify Functions
- Configure Neon database
- Set up CI/CD pipeline
- Configure monitoring

**Mitigation:**
- Use Infrastructure as Code (Terraform)
- Document deployment process
- Set up staging environment first
- Test thoroughly before production

---

## 9. Data Already in Sanity

### If Data Already Migrated to Sanity

**Problem:** Data now exists in Sanity, not MySQL

**Options:**

**Option A: Migrate Sanity → Payload**
```typescript
// Export from Sanity
const sanityClient = createClient({ ... });
const artists = await sanityClient.fetch('*[_type == "artist"]');

// Import to Payload
const payload = await getPayloadClient();
for (const artist of artists) {
  await payload.create({
    collection: 'artists',
    data: {
      name: artist.name,
      slug: artist.slug.current,
      bio: convertPortableTextToTipTap(artist.bio),
      // ... other fields
    },
  });
}
```

**Effort:** 🔴 **High** (essentially a new migration)

**Option B: Keep Sanity, Don't Switch**
- If significant progress already made in Sanity
- Switching costs outweigh benefits
- Consider Payload for future projects

**Option C: Dual-Source During Transition**
- Keep Sanity operational
- Gradually migrate collections to Payload
- Use both systems temporarily
- More complex but lower risk

**Mitigation:**
- Assess current Sanity progress
- Calculate switching cost vs. benefit
- Consider "sunk cost fallacy"
- Make data-driven decision

---

## 10. Vendor Lock-in vs Self-Hosted

### Sanity (Vendor Lock-in)

**Pros:**
- ✅ Fully managed (no servers)
- ✅ Automatic scaling
- ✅ Built-in CDN
- ✅ Zero devops

**Cons:**
- ❌ Vendor lock-in (data export possible but complex)
- ❌ Pricing changes (at vendor's discretion)
- ❌ Document limits (10k free tier)
- ❌ Less control over infrastructure

### Payload (Self-Hosted)

**Pros:**
- ✅ No vendor lock-in (open source)
- ✅ Full control over infrastructure
- ✅ Portable (deploy anywhere)
- ✅ No document limits

**Cons:**
- ❌ Server management required
- ❌ Must configure scaling
- ❌ Must set up CDN separately
- ❌ DevOps overhead

**Consideration:**
- Does team have DevOps expertise?
- Is vendor lock-in a concern?
- What's the long-term cost comparison?

---

## Complexity Summary

| Area | Switching Complexity | Effort | Can Automate? |
|------|---------------------|--------|---------------|
| Schema Redefinition | 🔴 High | Large | Partial |
| Rich Text Conversion | 🟡 Medium | Medium | Yes |
| Media Assets | 🔴 High | Large | Yes |
| Studio Customizations | 🔴 High | Large | No |
| Content Editor Training | 🟡 Medium | Medium | No |
| API Client Changes | 🟡 Medium | Medium | Partial |
| Query Rewriting | 🟡 Medium | Medium | No |
| Deployment Setup | 🟡 Medium | Medium | Yes |
| Data Migration | 🔴 High | Large | Yes |
| DevOps Overhead | 🟡 Medium | Ongoing | Partial |

**Total Estimated Effort:** 8-12 weeks (if switching from in-progress Sanity)

---

## Decision Framework

### Stay with Sanity If:

- ✅ Already significant progress in Sanity migration
- ✅ Team comfortable with GROQ and Portable Text
- ✅ Vendor-managed infrastructure preferred
- ✅ Document limits not a concern
- ✅ Budget allows for Sanity pricing

### Switch to Payload If:

- ✅ Early in Sanity migration (minimal sunk cost)
- ✅ Relational database benefits outweigh switching costs
- ✅ Team prefers SQL/GraphQL over GROQ
- ✅ Vendor lock-in is a concern
- ✅ DevOps resources available
- ✅ Long-term cost savings justify switching effort

---

## Recommended Approach

Given the problem statement ("really unhappy with Sanity"), here's a decision tree:

### Phase 1: Assessment (Week 1)
- Inventory current Sanity progress
- Calculate switching cost
- Evaluate team skills (SQL vs GROQ, DevOps)
- Compare long-term costs (Sanity vs Netlify+Neon)

### Phase 2: Proof of Concept (Weeks 2-3)
- Set up Payload locally
- Migrate 1-2 simple collections
- Test API integration
- Evaluate developer experience

### Phase 3: Decision (Week 4)
- Compare actual vs. expected effort
- Review team feedback
- Make go/no-go decision

### Phase 4: Migration (Weeks 5-12+)
- Follow [Migration Tasks](./04-migration-tasks.md)
- Start with database migration (MySQL → PostgreSQL)
- Build Payload collections incrementally
- Gradual cutover with feature flags

---

## Next Steps

- Review [Relational Advantages](./09-relational-advantages.md) to weigh benefits
- Check [Migration Tasks](./04-migration-tasks.md) for detailed steps
- Assess current Sanity progress before committing to switch
- Consider [Project Overview](./01-project-overview.md) for strategic context
