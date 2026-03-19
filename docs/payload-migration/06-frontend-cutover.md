# Chapter 6: Frontend Cutover Strategy

[← Back to Index](./README.md)

---

## Overview

The frontend cutover is a gradual process that moves the PHP site from reading MySQL directly to reading from Payload's PostgreSQL database. The PHP factories read Postgres directly (not via REST API), keeping the architecture simple. This chapter outlines the strategy and tracks progress.

---

## Current Status (March 2026)

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Parallel Systems | ✅ **DONE** | Data synced, integrity validated, nightly sync running |
| Phase 2: Feature Flag Infrastructure | ✅ **DONE** | `FeatureManager.php` + 11 flags + 8 Postgres factories built |
| Phase 3: Incremental Flag Enablement | **NEXT** | All flags currently `false` — ready to start flipping |
| Phase 4: Full Cutover | Planned | Remove MySQL fallback code |

> **Note:** MRM (Modern Rock Madness) is already running on Postgres in production — it's the first collection fully cut over.

---

## Cutover Phases

### Phase 1: Parallel Systems ✅ COMPLETE

**Goal:** Both MySQL and Payload/Postgres operational, no frontend changes

- ✅ MySQL database running (current source of truth for non-MRM content)
- ✅ Payload deployed to Netlify with PostgreSQL (Neon)
- ✅ All collections imported to prod Neon (6,370+ records)
- ✅ Data integrity validated — 6 integrity check scripts run with `--fix`
- ✅ Nightly sync running (`nightly-gap-report.yml` — daily at 3 AM UTC)
- ✅ Weekly dev DB sync running (`scheduled-db-sync.yml` — Mondays at 2 AM UTC)
- ✅ Artist data cleaned: 37 duplicate pairs merged, 12 mojibake names fixed, 20 "Y-Not Radio Presents:" consolidated
- ✅ PHP still reading from MySQL (except MRM)

---

### Phase 2: Feature Flag Infrastructure ✅ COMPLETE

**Goal:** Feature flags and Postgres read models ready for gradual cutover

**What's built:**

- `src/config/features.php` — 11 feature flags, all defaulting to `false`:
  - `use_postgres_concerts`, `use_postgres_deejays`, `use_postgres_music`
  - `use_postgres_ondemand`, `use_postgres_schedule`, `use_postgres_cdoftheweek`
  - `use_postgres_stories`, `use_postgres_customtext`, `use_postgres_madness`
  - `use_new_cd_of_the_week`, `use_new_ads`

- `src/models/FeatureManager.php` — 3-tier override hierarchy:
  1. **URL param / cookie** — `?ff=use_postgres_concerts` enables for current session
  2. **Environment variable** — `USE_POSTGRES_CONCERTS=true` enables for all requests
  3. **Config fallback** — `features.php` defaults
  - CP (control panel) pages automatically suppress Postgres flags as a safety measure

- **8 PHP Postgres factory classes** (readonly, with Cloudinary image support):
  - `ConcertFactory`, `DeejayFactory`, `MusicFactory`, `OnDemandFactory`
  - `ScheduleFactory`, `CdOfTheWeekFactory`, `CustomTextFactory`, `StoryFactory`

> **Note:** `AdFactory` remains MySQL-only. Ads load independently and won't block the cutover.

---

### Phase 3: Incremental Flag Enablement — NEXT

**Goal:** Enable Postgres feature flags one collection at a time, validate, and monitor

**Testing approach:** Use URL param overrides to validate each collection before enabling by default:
```
https://ynotradio.com/concerts.php?ff=use_postgres_concerts
```

**Migration Order (by risk level):**

| Priority | Page | Risk | Flag | Validation |
|----------|------|------|------|------------|
| 0 | Modern Rock Madness | — | `use_postgres_madness` | ✅ Already running on Postgres in prod |
| 1 | Concert calendar | Low | `use_postgres_concerts` | Verify dates/venues match MySQL |
| 2 | DJs listing | Low | `use_postgres_deejays` | Compare profile data and photos |
| 3 | On Demand | Low | `use_postgres_ondemand` | Verify audio links and metadata |
| 4 | Show schedule | Medium | `use_postgres_schedule` | Time formatting, day assignments |
| 5 | CD of the Week | Medium | `use_postgres_cdoftheweek` | Rich text rendering, cover images |
| 6 | New Music | Medium | `use_postgres_music` | Verify streaming/purchase links |
| 7 | Stories/Posts | Medium | `use_postgres_stories` | Content blocks, embedded media |
| 8 | Custom Text | Low | `use_postgres_customtext` | Static content blocks |

**Per-Collection Checklist:**

- [ ] Validate via URL param (`?ff=use_postgres_<collection>`) — spot-check pages
- [ ] Enable flag via env var on production
- [ ] Monitor error logs for 24-48 hours
- [ ] Confirm with nightly integrity check (no new discrepancies)
- [ ] Mark as stable

---

### Phase 4: Full Cutover (Future)

**Goal:** Remove MySQL reads, make Postgres/Payload the sole data source

**Steps:**

1. **Remove all feature flags** — delete MySQL fallback branches from factory classes
2. **Remove MySQL query code** — delete legacy PDO connections and query functions
3. **Update environment variables** — remove MySQL credentials
4. **Archive MySQL database** — final backup, then decommission
5. **Stop nightly sync pipeline** — no longer needed once MySQL is retired

---

## Rollback Strategy

### Emergency Rollback (if critical issue found)

**Steps:**

1. **Disable feature flags immediately:**
   - Set env var to `false` (e.g., `USE_POSTGRES_CONCERTS=false`)
   - Or clear the `FF` cookie / remove `?ff=` param
   - FeatureManager automatically falls back to MySQL

2. **Verify MySQL still operational** — nightly sync keeps MySQL current, so rollback is safe

3. **Investigate and fix** — check Postgres connection, query results, error logs

4. **Re-enable incrementally** — use URL param (`?ff=use_postgres_concerts`) to test fix before re-enabling via env var

### Partial Rollback (single collection issue)

Disable the specific flag via env var. Other collections remain on Postgres unaffected.

---

## Success Criteria

- [x] All collections imported and synced nightly
- [x] Data integrity validated (6 automated checks)
- [x] Feature flags built and tested
- [x] PHP Postgres models built for all readonly collections
- [x] MRM running on Postgres in production
- [ ] All non-MRM pages reading from Postgres
- [ ] Page load times ≤ MySQL baseline
- [ ] Error rate < 0.1%
- [ ] MySQL database archived
- [ ] Nightly sync pipeline retired

---

## Next Steps

- Review [Success Criteria](./07-success-criteria.md) for full validation details
- Check [Quick Reference](./08-quick-reference.md) for commands
- See [CMS Switching Considerations](./10-cms-switching-considerations.md) for complexity areas
