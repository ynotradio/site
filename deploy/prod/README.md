# Prod stack (legacy PHP)

Caddy (TLS, redirects) → Apache (`.htaccess`) → php-fpm 8.3, plus MySQL 8. Replaces the Bitnami Lightsail box. Verification steps: `docs/PROD_MIGRATION_TEST_PLAN.md`.

## Build a box

1. Create an Ubuntu LTS Lightsail instance with `launch.sh` as the launch script. Open ports 80 and 443.
2. Create the secret files (not in git):
   - `/opt/ynot/.env`: the keys in the old box's `~/htdocs/.env` (`DB_HOST=mysql`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT=3306`, `USE_POSTGRES_*` flags copied from old prod, Auth0, Postgres, Cloudinary).
   - `/opt/ynot/mysql.env`: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`.
3. Start it:

   ```sh
   cd /opt/ynot/site/deploy/prod
   docker compose --profile tools run --rm composer install --no-dev --optimize-autoloader
   docker compose up -d --build
   ```

4. Restore data: `gunzip -c dump.sql.gz | docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'`
5. Caddy issues its own cert over HTTP-01, so it can only do so after the static IP points at the new box. Expect TLS errors for up to a minute after the IP move. There is no cert to copy from the old box.
6. Before the IP move, from a laptop: `INSECURE=1 bin/verify-migration.sh verify --target <new-ip>` before the IP move.

## Deploy a change

```sh
cd /opt/ynot/site && git pull
cd deploy/prod && docker compose up -d --build
```

## Patch PHP

Bump the tag in `bin/docker/phpfpm/Dockerfile`, merge, then `docker compose build --pull phpfpm && docker compose up -d`.

## Local test

```sh
CADDY_EXTRA=local_certs YNOT_ENV_FILE=<env> YNOT_MYSQL_ENV_FILE=<mysql-env> docker compose up -d --build
INSECURE=1 bin/verify-migration.sh verify --target 127.0.0.1
```

`src/.env.local`, if present, overrides the env file; mount `/dev/null` over `/app/.env.local` to test with the env file.

## Backups

`launch.sh` installs a nightly `mysqldump` to `/opt/ynot/backups` (14 days). It stays on the instance, so also take Lightsail snapshots.
