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

The feature flag system uses the `FeatureFlags` utility class introduced in PR #63. This utility supports multiple detection methods (cookies, URL parameters, IP addresses) and enables granular control over feature rollouts.

### Basic Setup

```php
// Include the feature flags utility
require_once 'lib/feature-flags.php';

// Initialize with detection options
$featureFlags = new FeatureFlags([
    'cookie' => 'FF',      // Cookie name to check
    'uriParam' => 'ff'     // URL parameter to check (e.g., ?ff=sanity)
]);
```

### Checking Flags

```php
// Check if the 'sanity' flag is enabled
if ($featureFlags->hasFlag('sanity')) {
    // Read from Sanity
    $data = fetch_from_sanity($query);
} else {
    // Read from MySQL (legacy)
    $data = fetch_from_mysql($query);
}
```

### Enabling Flags

Flags can be enabled via:

1. **URL Parameter**: Add `?ff=sanity` to any page URL
2. **Cookie**: Set a cookie named `FF` with value `sanity`
3. **Multiple Flags**: Use comma-separated values: `?ff=sanity,auth_voting`

### Example: Migrating a Page

```php
// deejays.php
require_once 'lib/feature-flags.php';
require_once 'functions/sanity_fns.php';

$featureFlags = new FeatureFlags([
    'cookie' => 'FF',
    'uriParam' => 'ff'
]);

if ($featureFlags->hasFlag('sanity')) {
    // Fetch DJs from Sanity
    $deejays = sanity_fetch_deejays();
} else {
    // Fetch DJs from MySQL
    $deejays = mysql_fetch_deejays();
}

// Render page using $deejays data
```

### Testing Strategy

1. **Developer Testing**: Use `?ff=sanity` URL parameter during development
2. **Staging**: Set FF cookie for all testers
3. **Gradual Rollout**: Enable for specific users or IP addresses before full cutover
