# Current Environment Files Audit

## What We Have Now (THE MESS)

### .env Files

1. **`.env.local`** (32 lines, 49KB)
   - Used by: Next.js, Payload, Docker containers
   - Contains: Payload config, Neon credentials, local Docker MySQL, Auth0, Cloudinary
   - Loaded by: Next.js, docker-compose.yml (env_file)
   - **Problem**: Mixed local and production credentials

2. **`src/partials/.env`** (28 lines)
   - Used by: PHP legacy site
   - Contains: MySQL config, Postgres config, Auth0, Feature flags (USE*POSTGRES*\*)
   - Loaded by: `src/__env_loader.php`, `bin/migrations/config.ts`
   - **Problem**: Currently points at PRODUCTION Neon, local Docker MySQL

3. **`bin/migrations/.env`** (5 lines)
   - Used by: Import scripts
   - Contains: Only MySQL config (localhost for host machine access)
   - Loaded by: `bin/migrations/config.ts`
   - **Problem**: Overrides `src/partials/.env`, confusing precedence

4. **`src/partials/.env.local`** (18 lines)
   - Used by: PHP legacy site (attempted Dotenv load)
   - Contains: Empty/old config
   - Loaded by: `src/partials/__env_loader.php` (but Dotenv not available, so fails)
   - **Problem**: Dead code, should be removed

### Current Database Connections

**Production ynotradio.net (PHP site):**

- MySQL: Production AWS Lightsail MySQL
- Postgres: Can connect to production Neon (feature flags currently false)

**Local Docker (localhost:8080):**

- MySQL: `site-mysql-1` container
- Postgres: Can connect to production Neon (feature flags in `src/partials/.env`)

**Local Payload (localhost:3000):**

- Postgres: Production Neon (via `.env.local` DATABASE_URI)

**Import Scripts:**

- Read from: Local Docker MySQL (via `bin/migrations/.env`)
- Write to: Production Neon (via `.env.local`)

### The Confusion Matrix

| Script/Service   | MySQL Source            | Postgres Target | Env File Used                        |
| ---------------- | ----------------------- | --------------- | ------------------------------------ |
| Production PHP   | Prod Lightsail          | Prod Neon       | `src/partials/.env` (on server)      |
| Local PHP (8080) | Docker MySQL            | Prod Neon       | `src/partials/.env`                  |
| Payload (3000)   | N/A                     | Prod Neon       | `.env.local`                         |
| Import scripts   | Docker MySQL            | Prod Neon       | `bin/migrations/.env` + `.env.local` |
| refresh_local.sh | Prod Lightsail → Docker | N/A             | `src/partials/.env` (for creds)      |

## Problems

1. **Ambiguous "dev" vs "prod"**
   - `--env dev` in scripts writes to production Neon!
   - "dev" database is actually production
2. **No staging environment**
   - Testing imports directly modifies production Neon
   - No safe place to experiment

3. **Feature flags point at wrong database**
   - `src/partials/.env` has `USE_POSTGRES_*=true`
   - Points at production Neon
   - If deployed, would break production site

4. **Credential duplication**
   - Postgres creds in 2 files (`.env.local`, `src/partials/.env`)
   - MySQL creds in 3 files
   - Easy to get out of sync

5. **Import script writes to production**
   - `yarn import:incremental --env dev` writes to prod Neon
   - No confirmation, no safety check
   - One typo could corrupt production data

## What Needs to Happen

See `ENVIRONMENT_STRATEGY.md` for the proposed solution.
