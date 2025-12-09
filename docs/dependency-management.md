# Dependency Update Strategy

This document outlines the dependency management and update strategy for the Y-Not Radio project.

## Recent Updates (December 2025)

### Package Updates Completed

All Node.js packages have been updated to their latest compatible versions:

#### Production Dependencies
- **Sanity CMS Packages**:
  - `sanity`: 4.19.0 → 4.21.0
  - `@sanity/ui`: 2.0.0 → 3.1.11 (major version update)
  - `@sanity/vision`: 4.19.0 → 4.21.0
  - `@sanity/client`: 7.6.0 → 7.13.1
  - `@sanity/structure`: 2.36.2 (already latest)

- **React Packages**:
  - `react`: 19.1 → 19.2.1
  - `react-dom`: 19.1 → 19.2.1
  - `react-is`: 19.1.0 → 19.2.1

- **DnD Kit**:
  - `@dnd-kit/core`: 6.1.0 → 6.3.1
  - `@dnd-kit/sortable`: 8.0.0 → 10.0.0 (major version update)
  - `@dnd-kit/utilities`: 3.2.1 → 3.2.2

- **Other Dependencies**:
  - `dotenv`: 16.3.1 → 17.2.3 (major version update)
  - `mysql2`: 3.6.5 → 3.15.3
  - `styled-components`: 6.1.18 → 6.1.19

#### Development Dependencies
- **TypeScript & Type Definitions**:
  - `typescript`: 5.5.2 → 5.9.3
  - `@types/node`: 20.10.5 → 22.12.26
  - `@types/react`: 19.1 → 19.2.7

- **Testing**:
  - `vitest`: 4.0.14 → 4.0.15
  - `@vitest/coverage-v8`: 4.0.14 → 4.0.15

- **Linting** (kept at v8 for compatibility):
  - `eslint`: 8.57.0 → 8.57.1
  - `@typescript-eslint/eslint-plugin`: 7.18.0 (unchanged)
  - `@typescript-eslint/parser`: 7.18.0 (unchanged)

### Security Vulnerabilities Addressed

- **Before**: 17 vulnerabilities (2 low, 8 moderate, 7 high)
- **After**: 5 vulnerabilities (1 low, 2 moderate, 2 high)

The remaining 5 vulnerabilities are all in development-only MCP server packages:
- `@benborla29/mcp-server-mysql`
- `@sanity/mcp-server`

These packages are only used for local development tooling and do not affect production code.

### ESLint Note

ESLint was kept at version 8.x because:
- ESLint 9.x requires a new flat config format
- The `eslint-config-airbnb-typescript` package requires ESLint 8.x
- Migration to ESLint 9 would require updating all configuration files

We can migrate to ESLint 9 in the future when airbnb configs add support.

**Update (December 2025)**: After the initial dependency update, `@sanity/eslint-config-studio` was downgraded from v5.0.0 to v4.0.0 because v5+ requires ESLint 9. Dependabot has been configured to ignore major version updates for packages that require ESLint 9 until we're ready to migrate the entire toolchain.

## Automated Dependency Management

### Dependabot Configuration

Dependabot has been configured to automatically check for updates and create pull requests:

**Schedule**: Weekly on Mondays at 9:00 AM

**Package Ecosystems Monitored**:
1. npm (Node.js packages)
2. GitHub Actions

**Grouping Strategy**:
Updates are grouped to reduce PR noise:
- **sanity**: All `sanity` and `@sanity/*` packages
- **react**: React and React-related packages
- **testing**: Testing libraries (`@testing-library/*`, `vitest`, etc.)
- **tooling**: TypeScript, ESLint, Prettier
- **dnd-kit**: All `@dnd-kit/*` packages
- **github-actions**: All GitHub Actions updates

**Ignored Updates**:
To prevent incompatible upgrades, Dependabot is configured to ignore major version updates for:
- `@sanity/eslint-config-studio` (v5+ requires ESLint 9)
- `eslint` (v9 requires flat config, incompatible with airbnb-typescript)
- `@typescript-eslint/eslint-plugin` (v8+ requires ESLint 9)
- `@typescript-eslint/parser` (v8+ requires ESLint 9)
- `@types/node` (staying on v22 aligned with project's Node version)

These will be updated together when the project is ready to migrate to ESLint 9.

**PR Limits**:
- npm: Max 10 open PRs
- GitHub Actions: Max 5 open PRs

### Configuration File

The Dependabot configuration is located at `.github/dependabot.yml`

## Manual Update Process

When updates are needed outside of the automated schedule:

### 1. Check for Updates
```bash
npm outdated
```

### 2. Update Packages
For minor/patch updates:
```bash
npm update
```

For major updates or specific packages:
```bash
npm install package-name@latest
```

### 3. Check for Security Vulnerabilities
```bash
npm audit
```

Fix automatically:
```bash
npm audit fix
```

For breaking changes:
```bash
npm audit fix --force
```

### 4. Test Changes

Always test after updating:

```bash
# Run linter
npm run lint

# Run tests
npm test

# Validate Sanity schema (requires network/API access)
npm run sanity:schema-validate

# Build Sanity Studio (requires network/API access)
npm run sanity:build
```

### 5. Commit and Push
```bash
git add package.json package-lock.json
git commit -m "chore(deps): update dependencies"
git push
```

## Best Practices

### When to Update

- **Security vulnerabilities**: Update immediately
- **Major versions**: Review changelog and test thoroughly
- **Minor/patch versions**: Update regularly (weekly/monthly)
- **Pre-production environment**: Test all updates before production

### Reviewing Dependabot PRs

1. **Check the changelog**: Review what changed in the update
2. **Look at breaking changes**: Especially for major version updates
3. **Run CI**: Ensure all tests and checks pass
4. **Test locally**: For significant updates, test in dev environment
5. **Merge grouped PRs**: Review and merge related updates together

### Handling Breaking Changes

1. **Read migration guides**: Check package documentation
2. **Update configuration**: Modify config files as needed
3. **Update code**: Fix any breaking API changes
4. **Update tests**: Ensure tests reflect new behavior
5. **Document changes**: Note any significant changes for the team

## Monitoring and Notifications

### GitHub Notifications

Team members can enable notifications for:
- Dependabot PRs
- Security alerts
- Failed CI checks

### Security Alerts

GitHub will automatically:
- Create security advisories
- Open Dependabot PRs for vulnerable packages
- Send email notifications (if enabled)

### CI Integration

All Dependabot PRs will automatically:
- Run linting checks
- Run test suite
- Validate Sanity schema
- Check PHP code (for PHP files)

## Troubleshooting

### Common Issues

**Peer dependency warnings**:
```bash
npm install --legacy-peer-deps
```

**Package conflicts**:
1. Remove `node_modules` and `package-lock.json`
2. Run `npm install` fresh

**ESLint configuration errors**:
- Check that ESLint version matches the config requirements
- Verify plugin compatibility

**TypeScript errors after updates**:
- Update `@types/*` packages
- Check TypeScript version compatibility
- Review breaking changes in type definitions

## Future Improvements

### Potential Enhancements

1. **ESLint 9 Migration**: When airbnb configs support it
2. **Automated Testing**: Add more comprehensive test coverage
3. **Dependency Dashboard**: Consider tools like Renovate for advanced features
4. **Version Pinning**: Consider exact versions for critical dependencies

## Resources

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates): Alternative CLI tool
- [Snyk](https://snyk.io/): Advanced security scanning
- [GitHub Security Advisories](https://github.com/advisories)

## Contact

For questions about dependency management:
- Open an issue on GitHub
- Contact the development team
- Review this document for guidance
