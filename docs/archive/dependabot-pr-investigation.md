# Dependabot PR Investigation - December 2025

## Problem Statement

After merging PR #99 which updated all Node.js dependencies, multiple Dependabot PRs were opened almost immediately, including:

- **PR #101**: Attempting to upgrade `@sanity/eslint-config-studio` from 4.0.0 to 5.0.2
- **PR #102**: Attempting to upgrade ESLint tooling (ESLint 8→9, typescript-eslint 7→8)  
- **PR #103**: Attempting to upgrade `@types/node` from 22→24

This was confusing because PR #99 had *intentionally* downgraded `@sanity/eslint-config-studio` from v5 to v4 to maintain compatibility with ESLint 8.

## Root Cause

The issue was that Dependabot was not aware of the intentional version constraints. The repository needs to stay on ESLint 8 because:

1. **ESLint 9** requires a new "flat config" format that is incompatible with the current setup
2. **eslint-config-airbnb-typescript** only supports ESLint 8.x (not 9.x)
3. **@sanity/eslint-config-studio v5+** requires ESLint 9
4. **@typescript-eslint v8+** requires ESLint 9

The project made a conscious decision to stay on ESLint 8 until the airbnb config adds support for ESLint 9's flat config format. However, Dependabot wasn't told about these constraints, so it kept proposing upgrades that would break the build.

## Solution

Updated `.github/dependabot.yml` to add `ignore` rules that tell Dependabot to skip major version updates for these packages:

```yaml
ignore:
  # @sanity/eslint-config-studio v5+ requires ESLint 9
  - dependency-name: "@sanity/eslint-config-studio"
    update-types: ["version-update:semver-major"]
  # ESLint 9 uses flat config which is incompatible with current setup
  - dependency-name: "eslint"
    update-types: ["version-update:semver-major"]
  # typescript-eslint v8 requires ESLint 9
  - dependency-name: "@typescript-eslint/eslint-plugin"
    update-types: ["version-update:semver-major"]
  - dependency-name: "@typescript-eslint/parser"
    update-types: ["version-update:semver-major"]
  # @types/node should stay aligned with project's Node version
  - dependency-name: "@types/node"
    update-types: ["version-update:semver-major"]
```

These rules will:
- **Prevent** major version updates (e.g., 4.x → 5.x, 8.x → 9.x)
- **Allow** minor and patch updates (e.g., 4.0.0 → 4.0.1, 8.57.0 → 8.57.1)

## Documentation Updates

Updated `docs/dependency-management.md` to document:
- The reason for staying on ESLint 8
- The specific packages that are intentionally version-locked
- That these will be updated together when the project migrates to ESLint 9

## Expected Outcome

With these changes:
1. **PR #101, #102, #103 should not be recreated** after they are closed
2. Dependabot will continue to propose **minor and patch updates** for these packages
3. Dependabot will propose updates for **all other packages** normally
4. The team can decide when to migrate to ESLint 9, and at that time, remove these ignore rules

## Next Steps

### Immediate Actions (for repository maintainers)

1. ✅ **Close the unwanted Dependabot PRs**:
   - Close PR #101 (`@sanity/eslint-config-studio` 4.0.0 → 5.0.2)
   - Close PR #102 (ESLint tooling v8 → v9)
   - Close PR #103 (`@types/node` 22 → 24)
   
   These will not be recreated thanks to the new ignore rules.

2. **Merge this PR** to apply the Dependabot configuration changes

### Future Migration to ESLint 9

When ready to migrate to ESLint 9:

1. **Check compatibility**: Verify that `eslint-config-airbnb-typescript` supports ESLint 9
2. **Remove ignore rules**: Delete the `ignore` section from `.github/dependabot.yml`
3. **Update all at once**: Upgrade ESLint, typescript-eslint, and @sanity/eslint-config-studio together
4. **Migrate config**: Convert `.eslintrc.json` to the new flat config format
5. **Test thoroughly**: Ensure linting still works correctly

## References

- **PR #99**: Initial dependency update that included Dependabot setup
- **Commit 1b92fa1**: Downgraded `@sanity/eslint-config-studio` from v5 to v4
- **ESLint 9 migration guide**: https://eslint.org/docs/latest/use/migrate-to-9.0.0
- **eslint-config-airbnb-typescript**: https://github.com/iamturns/eslint-config-airbnb-typescript

## Lessons Learned

1. **Document version constraints**: When intentionally staying on older versions, document why
2. **Configure Dependabot appropriately**: Use `ignore` rules to prevent unwanted upgrade proposals
3. **Group related updates**: The tooling group should include all ESLint-related packages
4. **Communicate blockers**: Make it clear when waiting for upstream compatibility
