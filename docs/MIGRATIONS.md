# Database Migrations

This project uses Payload CMS migrations to manage database schema changes.

## Development Workflow

### Check Migration Status
```bash
npm run payload:migrate:status
```

### Run Pending Migrations (Dev)
```bash
npm run payload:migrate
```

### Create New Migration
```bash
npm run payload:migrate:create
```

## Production Workflow

Use the `bin/migrate-prod.sh` script to run migrations against production:

### Check Production Migration Status
```bash
./bin/migrate-prod.sh status
```

### Run Migrations on Production
```bash
./bin/migrate-prod.sh migrate
```

**⚠️ Important:** Always run migrations on production BEFORE deploying code changes that depend on the new schema.

## Migration Process for Schema Changes

1. **Make schema changes** in collection config files (e.g., `payload/src/collections/*.ts`)
2. **Generate migration** locally: `npm run payload:migrate:create`
3. **Test migration** on dev database: `npm run payload:migrate`
4. **Commit migration files** to git
5. **Run migration on production**: `./bin/migrate-prod.sh migrate`
6. **Deploy code** (merge to master or deploy branch)

## Notes

- Migrations are stored in `payload/migrations/`
- Dev database URL uses `DATABASE_URI` from `.env.local`
- Prod migrations use `NEON_PROD_DATABASE_URL` from `.env.local`
- Netlify builds do NOT automatically run migrations (must be done manually)
