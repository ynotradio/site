# PostgreSQL with Pre-seeded Payload Data

This Docker image provides a PostgreSQL 16 database with Payload CMS schema and sample data pre-installed, designed for agent testing and local development.

## What's Included

- **PostgreSQL 16** (Alpine-based for smaller image size)
- **Payload schema** (all collections migrated)
- **Sample data** seeded across 8 collections:
  - People (DJs, Artists)
  - Venues
  - Concerts
  - Posts
  - Shows
  - Songs, Records, Artists
  - Media

## Usage

### Using Docker Compose (Recommended)

```bash
# Start all services including pre-seeded Postgres
docker-compose up postgres

# Postgres will be available at:
# Host: localhost
# Port: 5432
# Database: ynot_payload_dev
# User: ynot_postgres_user
# Password: ynot_postgres_pass
```

### Using Pre-built Image from GHCR

```bash
# Pull the latest seeded image
docker pull ghcr.io/ynotradio/site/postgres-seeded:latest

# Run the container
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_DB=ynot_payload_dev \
  -e POSTGRES_USER=ynot_postgres_user \
  -e POSTGRES_PASSWORD=ynot_postgres_pass \
  --name ynot-postgres \
  ghcr.io/ynotradio/site/postgres-seeded:latest
```

### Building Locally

```bash
# Build the seeded Postgres image
docker build -f bin/docker/postgres/Dockerfile -t ynot-postgres-seeded .

# Run the container
docker run -d -p 5432:5432 --name ynot-postgres ynot-postgres-seeded
```

## Environment Variables

The container uses these defaults (can be overridden):

```env
POSTGRES_DB=ynot_payload_dev
POSTGRES_USER=ynot_postgres_user
POSTGRES_PASSWORD=ynot_postgres_pass
```

## How Seeding Works

On first container start, the initialization script (`init-seed.sh`) automatically:

1. Waits for PostgreSQL to be ready
2. Installs Node.js dependencies
3. Runs Payload migrations to create schema
4. Seeds the database with sample data via `bin/seed-payload.ts`
5. Cleans up build artifacts to reduce image size

**Note:** The seeding only runs on the **first container start**. Data persists in the volume, so subsequent starts are instant.

## Connecting to the Database

### From Payload Application

Set these environment variables:

```env
DATABASE_URI=postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev
DATABASE_SSL=disable
```

### From psql CLI

```bash
psql postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev
```

### From Docker Container

```bash
docker exec -it ynot-postgres psql -U ynot_postgres_user -d ynot_payload_dev
```

## Re-seeding the Database

To start fresh with new seed data:

```bash
# Stop and remove the container with its volume
docker-compose down -v postgres

# Start fresh (will re-run initialization)
docker-compose up postgres
```

## Performance

- **First start (seeding):** ~2-3 minutes (runs migrations + seeds data)
- **Subsequent starts:** ~5-10 seconds (data already seeded)
- **Pre-built image pull:** ~30-60 seconds (includes all dependencies)

## Image Size

- **Base postgres:16-alpine:** ~240 MB
- **With Node.js + dependencies:** ~450 MB
- **Final image (with cleanup):** ~400 MB

## For Agent Testing

Agents can use the pre-built image for instant database access:

```bash
# Quick start with pre-seeded data
docker run -d -p 5432:5432 ghcr.io/ynotradio/site/postgres-seeded:latest

# Wait ~10 seconds for startup, then connect
DATABASE_URI=postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev yarn dev
```

See `docs/AGENT_TESTING_CHECKLIST.md` for complete testing workflow.
