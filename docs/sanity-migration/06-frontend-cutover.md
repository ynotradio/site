# Chapter 6: Frontend Cutover Strategy

[← Back to Index](./README.md)

---

## Phase A: Feature Flag Testing

1. Implement feature flag in PHP config
2. Update pages to check flag and read from Sanity
3. Test thoroughly with flag enabled
4. Fix any rendering issues

**Key principle:** Read from Sanity behind a feature flag. Wait until the entire migration is ready before training site owners.

---

## Phase B: Incremental Migration

1. Run upsert migrations regularly
2. Monitor for validation errors
3. Manually fix any issues
4. Verify record counts match

**Key principle:** Keep running incremental migrations until we have full parity, then cut over. No dual-write complexity.

---

## Phase C: Full Cutover

1. Run final migration
2. Verify all data in Sanity
3. Enable feature flag for all users
4. Train site owners on Sanity Studio
5. Archive MySQL (keep read-only backup)

---

## Timeline Overview

```
Phase A (Testing)
├── Implement feature flag
├── Add Sanity client to PHP
├── Update one page (e.g., deejays.php)
└── Test with flag enabled

Phase B (Migration)
├── Run migrations weekly
├── Review error reports
├── Manual fixes as needed
└── Verify parity

Phase C (Cutover)
├── Final migration run
├── Enable flag for all
├── Train site owners
└── Archive MySQL
```

---

## Feature Flag Implementation

```php
// src/partials/.env
SANITY_READ_ENABLED=false

// src/functions/sanity_fns.php
function is_sanity_enabled(): bool {
    return getenv('SANITY_READ_ENABLED') === 'true';
}
```
