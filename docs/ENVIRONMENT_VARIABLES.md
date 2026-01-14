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

### PostgreSQL (for PHP concerts feature)

```bash
POSTGRES_HOST=your-database-host.neon.tech
POSTGRES_PORT=5432
POSTGRES_DATABASE=your_database_name
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_SSL_MODE=require  # or 'disable' for local dev
```

### Payload CMS / Node.js

```bash
DATABASE_URI=postgresql://user:pass@host:5432/dbname
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

### Feature Flags (Optional)

Feature flags can be set via environment variables to enable Postgres mode for specific models. These override the defaults in `src/config/features.php`.

```bash
# Set any of these to 'true', '1', 'yes', or 'on' to enable
USE_POSTGRES_CONCERTS=true
USE_POSTGRES_ONDEMAND=true
USE_POSTGRES_DEEJAYS=true
USE_POSTGRES_MUSIC=true
USE_POSTGRES_STORIES=true
USE_POSTGRES_CDOFTHEWEEK=true
USE_POSTGRES_SCHEDULE=true
USE_POSTGRES_CUSTOMTEXT=true
```

**Priority Order:**
1. Runtime flags (cookie `FF` or URL parameter `ff`) - highest priority
2. Environment variables (from `.env`) - overrides config file
3. Config file (`src/config/features.php`) - default values

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
- Verify Neon endpoint ID is extracted correctly
- Check SSL mode matches your environment
- Test connection: `docker-compose exec phpfpm php -r "new PDO('pgsql:host=...', 'user', 'pass');"`

### MySQL connection warnings
- Add `DB_HOST=mysql` to `.env.local` (for Docker)
- Or `DB_HOST=localhost` (for local development)

## Related Documentation

- [PostgreSQL Concert Model](./POSTGRES_CONCERT_MODEL.md)
- [Payload Migration Plan](./payload-migration/README.md)
