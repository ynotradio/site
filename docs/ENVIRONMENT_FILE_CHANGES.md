# Environment File Changes - January 2026

## What Changed

We consolidated the environment file structure from the complex multi-file setup to a cleaner, more maintainable structure.

### Before (Old Structure - Documented in CURRENT_ENVIRONMENT_AUDIT.md)

```
.env.local              → Mixed local/production config
src/partials/.env       → PHP production config
src/partials/.env.local → Unused/dead code
bin/migrations/.env     → Import script config
```

### After (New Structure - January 2026)

```
.env.local              → Local development (all services)
.env.php                → Production PHP server
.env.production         → Netlify production (Next.js/Payload)
.env.preview            → Netlify preview (Next.js/Payload)
.env.production.mysql   → Import scripts only
```

## Key Changes

1. **Removed**: `src/partials/.env*` files (all variants)
2. **Removed**: `bin/migrations/.env`
3. **Added**: `.env.php` - deployed to production PHP server as `~/htdocs/.env`
4. **Added**: `.env.production` - for Netlify production deployments
5. **Added**: `.env.preview` - for Netlify preview deployments
6. **Updated**: `bin/deploy.sh` - now deploys `.env.php` → `~/htdocs/.env`
7. **Updated**: PHP env loaders - now look in repository root instead of `src/partials/`

## Migration Guide

### For Production Deployments

```bash
# Old way
scp src/partials/.env ynotradio:~/htdocs/partials/.env

# New way
bin/deploy.sh  # Automatically deploys .env.php → ~/htdocs/.env
```

### For Local Development

```bash
# Old way
cp src/partials/.env.example src/partials/.env
cp .env.example .env.local

# New way
cp .env.example .env.local  # Only one file needed
```

### For E2E Tests

The setup script now creates only `.env.local`:

```bash
yarn setup:e2e  # Creates .env.local with test config
```

## Documentation Updates

- ✅ README.md - Updated installation instructions
- ✅ CONTRIBUTING.md - Already used correct paths
- ✅ bin/deploy.sh - Updated to deploy .env.php
- ✅ bin/deploy_mrm_2025.sh - Removed .env.example deployment
- ✅ bin/pull_db.sh - Updated to read from .env.php
- ✅ bin/setup-e2e-env.sh - Removed src/partials/.env creation
- ⚠️ Historical docs preserved for context (see below)

## Historical Documentation

These documents describe the OLD structure and are archived for reference:

- `docs/archive/environment/CURRENT_ENVIRONMENT_AUDIT.md` - Pre-2026 audit
- `docs/archive/environment/ENVIRONMENT_STRATEGY.md` - The proposal that led to these changes

If you need to understand the motivation for these changes, read `ENVIRONMENT_STRATEGY.md` in the archive.

## Related PRs

- Branch: `copilot/streamline-env-setup`
- See: `docs/PHP_ENV_MIGRATION.md` for technical details
