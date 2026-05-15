# Environment Variables Configuration

This document explains how environment variables are managed in this project, with a focus on security and avoiding committing secrets to version control.

## Overview

Environment variables are loaded from `.env.local` which is gitignored and never committed to the repository. Template values are provided in `.env.example` for reference.

## File Structure

```
.env.example       # Template with placeholder values (committed)
.env.local         # Actual secrets and config (gitignored)
```

## Required Environment Variables

### PostgreSQL Runtime and Automation

```bash
POSTGRES_HOST=your-database-host.example.com
POSTGRES_PORT=5432
POSTGRES_DATABASE=your_database_name
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_SSL_MODE=require  # or 'disable' for local dev
DATABASE_URI=postgresql://user:pass@host:5432/dbname
LOCAL_DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
PRODUCTION_DATABASE_URL=postgresql://user:pass@prod-host:5432/dbname
PREVIEW_DATABASE_URL=postgresql://user:pass@preview-host:5432/dbname

# Deprecated compatibility aliases during cutover
NEON_PROD_DATABASE_URL=postgresql://user:pass@prod-host:5432/dbname
NEON_DEV_DATABASE_URL=postgresql://user:pass@preview-host:5432/dbname
```

### Payload CMS / Node.js

```bash
PAYLOAD_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Legacy MySQL (for other features)

```bash
DB_HOST=mysql  # or localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=ynot_site
```

### Target Topology

- `DATABASE_URI` — active runtime connection for the current environment
- `LOCAL_DATABASE_URL` — explicit local development override
- `PRODUCTION_DATABASE_URL` — automation target for imports and refresh jobs
- `PREVIEW_DATABASE_URL` — automation target for preview refresh, gap reports, and integrity checks
- `NEON_*` — temporary compatibility aliases only

## How It Works

### Docker Environment

1. **docker-compose.yml** loads `.env.local` via `env_file` directive for the `phpfpm` service
2. **PHP-FPM Dockerfile** sets `clear_env = no` to pass environment variables to PHP scripts
3. PHP code reads variables using `getenv('VARIABLE_NAME')`

### Node.js/Payload

1. **payload/src/server.ts** uses `dotenv` to load `.env.local`
2. Node.js code reads variables via `process.env.VARIABLE_NAME`

### PHP-FPM Configuration

The custom PHP-FPM Dockerfile (`bin/docker/phpfpm/Dockerfile`) includes:
- PostgreSQL PDO extension (`pdo_pgsql`)
- MySQL PDO extension (`pdo_mysql`)
- Environment variable passthrough (`clear_env = no`)

## Setup Instructions

### Initial Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace `REPLACE_ME` placeholders with actual values

3. Rebuild Docker containers:
   ```bash
   docker-compose up -d --build
   ```

### Verifying Configuration

Check if environment variables are loaded in PHP:
```bash
docker-compose exec phpfpm php -r "echo getenv('POSTGRES_HOST');"
```

### For Local Development (outside Docker)

If running PHP scripts locally (not in Docker), source the environment:
```bash
export $(grep -v '^#' .env.local | xargs)
php test/test_postgres_concert.php
```

## Security Best Practices

✅ **DO:**
- Keep `.env.local` in `.gitignore`
- Use strong, unique passwords
- Rotate credentials periodically
- Use different credentials for dev/staging/production

❌ **DON'T:**
- Commit `.env.local` to git
- Hardcode secrets in docker-compose.yml
- Hardcode secrets in Apache/PHP config files
- Share credentials via Slack/email

## Deployment

### Production/Staging

For hosted environments (Netlify, Vercel, etc.):
1. Set environment variables in the hosting platform's dashboard
2. Do NOT use `.env.local` in production
3. Use platform-specific secret management

### CI/CD

For GitHub Actions or similar:
1. Store secrets in repository secrets
2. Pass to containers via environment variables
3. Never log secret values

## Troubleshooting

### PHP can't read environment variables
- Check `docker-compose logs phpfpm` for errors
- Verify `clear_env = no` in PHP-FPM config
- Restart containers: `docker-compose restart phpfpm`

### Connection errors to PostgreSQL
- Verify the correct runtime or automation URL is set for the environment you are testing
- Check SSL mode matches your environment
- Test connection: `docker-compose exec phpfpm php -r "new PDO('pgsql:host=...', 'user', 'pass');"`

### MySQL connection warnings
- Add `DB_HOST=mysql` to `.env.local` (for Docker)
- Or `DB_HOST=localhost` (for local development)

## Related Documentation

- [PostgreSQL Concert Model](./POSTGRES_CONCERT_MODEL.md)
- [Payload Migration Plan](./payload-migration/README.md)
- [Netlify Database Cutover](./NETLIFY_DATABASE_CUTOVER.md)
