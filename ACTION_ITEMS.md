# Action Items for Repository Maintainers

## Current Tasks

### 🎯 DJ Photo Import with Cloudinary

**Status**: Ready to implement (recommend new branch)

**Context**: 
- All 32 active DJs have photos that need to be migrated
- Photo sources: imgur.com URLs, app.box.com URLs, and local `images/` paths
- Multi-person DJ handling (e.g., "M.J. & Patria") is complete ✅

**Next Steps**:
1. Create new branch for Cloudinary integration: `feature/dj-photos-cloudinary`
2. Verify Cloudinary credentials in `.env.local`
3. Update `importDJs.ts` to:
   - Download/fetch photos from URLs or local paths
   - Upload to Cloudinary via Payload Media collection
   - Link Media record to DJ.photo field
4. Test with a few DJs before full import
5. Document photo migration process

**Files to Update**:
- `bin/migrations/importDJs.ts` - Add photo import logic
- `bin/migrations/shared/payloadClient.ts` - Add helper for media upload
- Test with sample DJs before production import

**Reference**:
- Cloudinary docs: `docs/payload-migration/12-cloudinary-integration.md`
- DJ inspection showed: 32 DJs with photos, 1 multi-person DJ ("M.J. & Patria" ✅)

---

## Completed Tasks

### ✅ Multi-Person DJ Support (2026-01-03)

**What Changed**:
- Updated `DJs` collection schema: `person` field now supports `hasMany: true`
- Modified `importDJs.ts` to parse names like "M.J. & Patria" into separate Person records
- Added `parseDJNames()` function that splits on " & " or " and "
- Updated tests to cover multi-person scenarios (14 tests passing)

**Verification**:
- DJ ID 34 ("M.J. & Patria") successfully created 2 Person records
- Import tested with IDs 34-84: 21 new, 4 skipped, 0 errors

---

## Historical Items

## What Happened

After merging PR #99 with dependency updates, Dependabot immediately opened 3 PRs trying to upgrade packages that were intentionally held back to maintain ESLint 8 compatibility.

## What Was Fixed

This PR adds Dependabot `ignore` rules to prevent those incompatible upgrades from being proposed again.

## Actions Required

### 1. Close the Unwanted Dependabot PRs ✅

Please close these PRs (they will not be recreated):

- **PR #101**: `@sanity/eslint-config-studio` 4.0.0 → 5.0.2
- **PR #102**: ESLint tooling upgrades (v8 → v9)
- **PR #103**: `@types/node` 22 → 24

You can close them with a comment like:
```
Closing as we're intentionally staying on [package] v[X] until ESLint 9 migration. See docs/dependabot-pr-investigation.md for details.
```

### 2. Review and Merge This PR ✅

This PR contains:
- Updated Dependabot configuration with ignore rules
- Documentation updates explaining the constraints
- Investigation report for future reference

Once merged, Dependabot will no longer propose these incompatible upgrades.

### 3. No Further Action Needed

After merging this PR:
- Dependabot will continue working normally for compatible updates
- Minor and patch updates for all packages will still be proposed
- The ignore rules will prevent future incompatible major version upgrades

## Future: Migrating to ESLint 9

When you're ready to migrate to ESLint 9:

1. **Check if airbnb-typescript supports ESLint 9**
   - Visit: https://github.com/iamturns/eslint-config-airbnb-typescript
   - Check if they've added ESLint 9 support

2. **Remove the ignore rules from `.github/dependabot.yml`**
   ```yaml
   # Delete the entire 'ignore:' section
   ```

3. **Upgrade everything together**
   ```bash
   yarn add --dev \
     eslint@^9 \
     @typescript-eslint/eslint-plugin@^8 \
     @typescript-eslint/parser@^8 \
     @sanity/eslint-config-studio@^5
   ```

4. **Migrate to ESLint flat config**
   - Follow: https://eslint.org/docs/latest/use/migrate-to-9.0.0
   - Convert `.eslintrc.json` to `eslint.config.js`

5. **Test thoroughly**
   ```bash
   yarn lint
   yarn test
   ```

## Questions?

See the detailed investigation report: `docs/dependabot-pr-investigation.md`
