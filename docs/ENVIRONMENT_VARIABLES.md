# Environment Variables

Environment variables are loaded from `.env.local` for local development. `.env.local` is gitignored and must never be committed.

## Local Files

```text
.env.example       # committed template
.env.local         # local secrets/config, gitignored
```

## Payload / Next.js

```bash
DATABASE_URI=postgresql://user:pass@host:5432/dbname
DATABASE_SSL=disable
PAYLOAD_SECRET=replace-me
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_DEV_EMAIL=admin@ynotradio.net
PAYLOAD_DEV_PASSWORD=password
CLOUDINARY_CLOUD_NAME=replace-me
CLOUDINARY_API_KEY=replace-me
CLOUDINARY_API_SECRET=replace-me
```

## Legacy PHP

```bash
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=ynot_site
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=ynot_payload_dev
POSTGRES_USER=ynot_postgres_user
POSTGRES_PASSWORD=dev_postgres_password_not_secret
POSTGRES_SSL_MODE=disable
PAYLOAD_ADMIN_SERVER_URL=http://localhost:3000
```

`PAYLOAD_ADMIN_SERVER_URL` is used by legacy `/cp/` links. In production it defaults to `https://ynotradio-admin.netlify.app` when unset.

## Docker Behavior

- `docker-compose.yml` passes `.env.local` into PHP-FPM.
- PHP-FPM sets `clear_env = no` so PHP can read environment variables.
- Payload loads `.env.local` from `payload/src/server.ts`.

## Setup

```bash
cp .env.example .env.local
docker compose up -d --build
```

## Verify PHP Environment

```bash
docker compose exec phpfpm php -r "echo getenv('POSTGRES_HOST');"
```

## Production

Set secrets in the hosting provider dashboard. Do not deploy `.env.local`.

## Security

- Keep `.env.local` out of git.
- Use separate credentials for local/dev/prod.
- Rotate production credentials periodically.
- Never log secret values.

## Related

- [Project Status](PROJECT_STATUS.md)
- [Payload Documentation](payload-migration/README.md)
- [Deployment Safety](DEPLOYMENT_SAFETY.md)
