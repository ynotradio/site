# Action Items for Repository Maintainers

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
