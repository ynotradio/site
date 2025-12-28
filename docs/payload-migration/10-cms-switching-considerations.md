# Chapter 10: CMS Comparison: Sanity vs Payload

[← Back to Index](./README.md)

---

## Overview

This chapter compares Sanity and Payload as migration targets from the current MySQL/PHP stack, highlighting key differences in approach, effort, and long-term considerations.

---

## Migration Approach

### Sanity (NoSQL Document Store)

**Data Model:** MySQL tables → Sanity documents
- Artists become `artist` documents
- Relationships become references (`_ref` fields)
- Foreign keys replaced with application-level validation
- Rich text converts to Portable Text (proprietary format)

**Effort:** Medium-High
- Learn GROQ query language
- Understand document-based thinking
- Manage reference integrity in application code

### Payload (Relational + CMS)

**Data Model:** MySQL tables → PostgreSQL tables → Payload collections
- Direct schema translation (tables stay tables)
- Foreign keys preserved at database level
- Standard SQL queries
- Rich text converts to TipTap/Lexical JSON

**Effort:** Medium
- Leverage existing SQL knowledge
- Database enforces relationships
- Standard REST/GraphQL APIs

---

## Key Differences

| Aspect | Sanity | Payload |
|--------|--------|---------|
| **Database** | Proprietary NoSQL | PostgreSQL (your control) |
| **Queries** | GROQ (learn new syntax) | SQL / REST / GraphQL |
| **Relationships** | References (app-enforced) | Foreign keys (DB-enforced) |
| **Rich Text** | Portable Text | TipTap / Lexical |
| **Hosting** | Sanity-hosted | Self-hosted (Netlify, etc.) |
| **Pricing** | $0-99/month (document limits) | $0-38/month (resource limits) |
| **Lock-in** | Vendor lock-in | Open source, portable |
| **Voting Data** | Separate Neon DB required | Same PostgreSQL DB |

---

## Schema Definition

### Sanity Approach

```typescript
// Declarative schema in JavaScript
export default defineType({
  name: 'artist',
  type: 'document',
  fields: [
    defineField({
      name: 'members',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'person' }] }]
    })
  ]
});
```

### Payload Approach

```typescript
// TypeScript collection config
export const Artists: CollectionConfig = {
  slug: 'artists',
  fields: [
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true
    }
  ]
};
```

**PostgreSQL schema auto-generated:**
```sql
CREATE TABLE artists (...);
CREATE TABLE artist_members (
  artist_id INTEGER REFERENCES artists(id),
  person_id INTEGER REFERENCES people(id)
);
```

---

## Rich Text

### HTML → Portable Text (Sanity)

**Migration complexity:** Medium
- Custom converters needed
- Proprietary format
- Limited reusability outside Sanity

### HTML → TipTap (Payload)

**Migration complexity:** Low
- Standard libraries available (`@tiptap/html`)
- Open standard (ProseMirror)
- Portable across systems

---

## Voting System Architecture

### Sanity Approach

**Hybrid architecture required:**
- Content in Sanity (contests, songs, artists)
- Votes in separate Neon PostgreSQL
- Two databases to manage
- Cross-database queries complex

### Payload Approach

**Unified architecture:**
- Everything in one PostgreSQL database
- Content and votes together
- Simple SQL joins
- Single backup/restore

---

## Infrastructure

### Sanity

**Managed service:**
- ✅ No server setup
- ✅ Auto-scaling
- ✅ Built-in CDN
- ❌ Vendor dependence
- ❌ Limited control

**Cost:** $0-99/month based on document count

### Payload

**Self-hosted:**
- ⚠️ Requires deployment (Netlify Functions)
- ⚠️ Database setup (Neon)
- ⚠️ CDN configuration
- ✅ Full control
- ✅ No vendor lock-in

**Cost:** $0-38/month based on resources

---

## Decision Factors

### Choose Sanity If:

- Prefer fully managed service
- Don't want to manage infrastructure
- Comfortable with NoSQL/documents
- Willing to learn GROQ
- Document-centric content model

### Choose Payload If:

- Want relational database continuity
- Prefer SQL over GROQ
- Need full infrastructure control
- Concerned about vendor lock-in
- Have DevOps resources
- Want unified database for content + votes

---

## Effort Estimate

### Sanity Migration (from MySQL)

| Phase | Effort |
|-------|--------|
| Schema design (NoSQL modeling) | 3-4 weeks |
| Data migration scripts | 4-5 weeks |
| Learn GROQ | 2 weeks |
| Voting system (Neon integration) | 2 weeks |
| Frontend integration | 3-4 weeks |
| **Total** | **14-17 weeks** |

### Payload Migration (from MySQL)

| Phase | Effort |
|-------|--------|
| PostgreSQL migration | 2-3 weeks |
| Payload collections | 3-4 weeks |
| Data migration scripts | 3-4 weeks |
| Frontend integration | 3-4 weeks |
| **Total** | **11-15 weeks** |

**Payload advantage:** Relational continuity saves 3-4 weeks

---

## Long-Term Considerations

### Maintenance

**Sanity:**
- Managed updates (automatic)
- GROQ query optimization (black box)
- Document limit monitoring
- Vendor pricing changes

**Payload:**
- Self-managed updates
- SQL query optimization (full control)
- Resource monitoring
- Predictable open-source pricing

### Portability

**Sanity:**
- Export via API possible
- Data transformation required
- Portable Text conversion needed
- Significant migration effort to leave

**Payload:**
- Standard PostgreSQL dump
- No proprietary formats
- Standard SQL/JSON
- Easy migration to other platforms

---

## Recommendation

For Y-Not Radio's needs:

**Payload + PostgreSQL** is recommended because:

1. **Relational continuity** - Simpler migration from MySQL
2. **Unified database** - Votes and content together
3. **No vendor lock-in** - Open source portability
4. **Cost effective** - $0-38/month vs $99/month
5. **SQL familiarity** - Leverage existing knowledge
6. **Full control** - Database queries, indexes, backups

**Trade-off:** Requires infrastructure management (mitigated by Netlify + Neon)

---

## Next Steps

- Review [Relational Advantages](./09-relational-advantages.md) for detailed comparison
- Check [Migration Tasks](./04-migration-tasks.md) for implementation
- See [Capacity Planning](./11-capacity-planning.md) for resource estimates
