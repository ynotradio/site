# Chapter 12: Capacity Planning

[← Back to Index](./README.md)

---

## Sanity Document Limits

**Current Plan:** Free tier with 10,000 document limit  
**Current Usage:** ~8,400 documents (as of Dec 2024)  
**Remaining:** ~1,600 documents

---

## MySQL Database Content Inventory

Analysis performed on December 28, 2024:

| Content Type | Total Records | Annual Growth | Notes |
|--------------|--------------|---------------|-------|
| **Music** | 5,408 | ~380/year | New music submissions |
| **Concerts** | 4,464 | ~350/year | Concert listings |
| **Stories/Posts** | 781 | Variable | News, features, posts |
| **OnDemand** | 516 | Variable | Archived shows/episodes |
| **Schedule** | 30,877 | ~2,200/year | Show scheduling entries |
| **Deejays/Shows** | 84 | Minimal | DJ profiles and show info |
| **Custom Texts** | 62 | Minimal | Static content pages |

**Database Size:** 13.35 MB

---

## Migration Strategy with Pruning

To fit within the 10k document limit, we'll implement time-based pruning for certain content types:

### Content Retention Policies

| Content Type | Retention Policy | Rationale |
|--------------|------------------|-----------|
| **Music** | 3-10 years (see below) | Balance historical archive with capacity |
| **Concerts** | 18 months | Past concerts have limited value, keeps ~525 documents |
| **Schedule** | 3 months | Current/upcoming shows only, keeps ~550 documents |
| **OnDemand** | Permanent | Audio archive has long-term value |
| **Stories/Posts** | Permanent | Editorial content worth preserving |
| **Shows/DJs** | Permanent | Core site content |
| **Custom Texts** | Permanent | Static pages and content |

### Music Retention Strategy Comparison

Based on historical data analysis (Dec 2024):

| Retention Period | Music Documents | Static Content | Time-Limited* | **Total** | % of Limit | Buffer |
|-----------------|-----------------|----------------|---------------|-----------|------------|--------|
| **3 years** | 1,148 | 1,443 | 1,075 | **3,666** | 37% | 6,334 |
| **5 years** ⭐ | 1,898 | 1,443 | 1,075 | **4,416** | 44% | 5,584 |
| **10 years** | 3,323 | 1,443 | 1,075 | **5,841** | 58% | 4,159 |
| All (14+ years) | 5,408 | 1,443 | 1,075 | **7,926** | 79% | 2,074 |

*Time-Limited = Concerts (18mo: ~525) + Schedule (3mo: ~550)*

### Recommended Strategy: 5 Years ⭐

**Why 5 years is the sweet spot:**
- 1,898 music documents provides substantial historical depth
- 5,584 document buffer (56% headroom) provides excellent safety margin
- Covers full relevance window for music discovery
- ~380 songs/year means steady-state with no net growth

**Alternative strategies:**
- **3 years:** Maximum safety margin (63% buffer) but limited history
- **10 years:** Extensive back catalog (42% buffer) with deeper archive
- **All history:** Complete archive but approaching limits by 2028

### Projected Document Count (5-Year Music Retention)

```
Static/Long-lived Content:
- OnDemand episodes:     516
- Stories/Posts:         781
- Custom texts:           62
- Deejays/Shows:          84
Subtotal:              1,443

Time-Limited Content:
- Music (5 years):     1,898
- Concerts (18mo):      ~525
- Schedule (3mo):       ~550
Subtotal:              2,973

TOTAL:                 4,416 documents
Buffer:                5,584 (56%)
```

**Result:** ✅ Sustainable indefinitely within 10k free tier limit

---

## Schedule Table Optimization

The schedule table has 30k+ entries but most are historical. Strategies:

1. **Prune old entries** - Keep only last 3 months (~550 documents)
2. **Don't import as individual documents** - Consider alternative approaches:
   - Embed schedule entries within show documents as arrays
   - Use a separate scheduling system/database
   - Query directly from MySQL for schedule display

**Recommendation:** Import only current/future schedule entries as documents, prune monthly via automated job.

---

## Growth Projections

With 5-year music retention strategy (recommended):

| Year | Music (5yr) | Concerts (18mo) | Schedule (3mo) | Static | Total Est. |
|------|-------------|-----------------|----------------|--------|------------|
| 2025 | 1,898 | 525 | 550 | 1,443 | ~4,416 |
| 2026 | 1,900 | 525 | 550 | 1,443 | ~4,418 |
| 2027 | 1,900 | 525 | 550 | 1,443 | ~4,418 |
| 2028 | 1,900 | 525 | 550 | 1,443 | ~4,418 |
| 2029+ | 1,900 | 525 | 550 | 1,443 | ~4,418 |

**Steady state:** ~4,400 documents (44% capacity)

### Comparison by Music Retention Period

| Retention | Steady State | % Capacity | Long-term Sustainability |
|-----------|--------------|------------|--------------------------|
| 3 years | ~3,666 | 37% | ✅ Indefinite (most conservative) |
| 5 years | ~4,416 | 44% | ✅ Indefinite (recommended) |
| 10 years | ~5,841 | 58% | ✅ Indefinite (maximum archive) |
| All history | Growing | Hits 10k by 2028 | ⚠️ Requires upgrade or pruning |

**Key insight:** Any time-based pruning strategy (3/5/10 years) creates a sustainable steady state, as annual additions equal annual deletions (~380 songs/year).

---

## Automated Pruning Implementation

Recommended approach:

```typescript
// scripts/sanity/prune-old-content.ts
// Run monthly via cron job

const RETENTION_POLICIES = {
  music: { years: 5 },      // Configurable: 3, 5, or 10 years
  concert: { months: 18 },
  schedule: { months: 3 },
};

// Delete music older than 5 years (configurable)
// Delete concerts older than 18 months
// Delete schedule entries older than 3 months
```

**Cron schedule:** Run first day of each month at 2am

**Flexibility:** The music retention period can be adjusted based on needs:
- Start with 5 years (recommended)
- Expand to 10 years if capacity allows
- Contract to 3 years if approaching limits

---

## Alternative Approaches

If approaching limits or need more flexibility:

1. **Upgrade Sanity Plan**
   - Growth plan: 500k documents
   - Cost: Check current pricing
   - Removes all capacity concerns

2. **Adjust Music Retention**
   - Start at 5 years (recommended)
   - Expand to 10 years if comfortable (~5,841 docs total)
   - Contract to 3 years if needed (~3,666 docs total)
   - Each year adds/removes ~380 documents

3. **Hybrid Approach**
   - Keep concerts/schedule in MySQL
   - Query directly for display
   - Only migrate editorial content to Sanity
   - Save ~1,075 documents

---

## Monitoring

Track document counts via Sanity API:

```bash
# Check current document counts by type
npm run sanity:doc-count

# Get total document count
npm run sanity:usage
```

Set up alerts when approaching:
- 9,000 documents (90% capacity)
- 9,500 documents (95% capacity)

---

[← Back to Index](./README.md)
