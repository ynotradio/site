# PostgreSQL Concert Model

`ConcertFactory` currently returns the PostgreSQL-backed concert read model. The old feature-flag/MySQL fallback path is retired.

## Current Files

- `src/models/ConcertFactory.php`
- `src/models/implementations/PostgresConcert.php`
- `src/lib/Database.php`

## Environment Variables

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=ynot_payload_dev
POSTGRES_USER=ynot_postgres_user
POSTGRES_PASSWORD=dev_postgres_password_not_secret
POSTGRES_SSL_MODE=disable
```

Use `POSTGRES_SSL_MODE=require` for Neon.

## Payload Tables

- `concerts`
- `concerts_rels`
- `artists`
- `venues`
- `media`

## Compatibility Behavior

`PostgresConcert` adapts Payload/Postgres data to the legacy PHP concert interface:

- Timestamps become `YYYY-MM-DD` date strings.
- Boolean featured values become legacy `Yes` / `No` strings.
- Related artists are aggregated for legacy display code.
- Writes remain read-only from PHP; edit concerts in Payload admin.

## Admin URL

- Local: `http://localhost:3000/admin/collections/concerts`
- Production: `https://ynotradio-admin.netlify.app/admin/collections/concerts`
