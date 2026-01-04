# Dockerfile for PostgreSQL with pre-seeded Payload data
# This image includes all Payload schema and sample data for agent testing
FROM postgres:16-alpine

# Install Node.js and dependencies needed for Payload seeding
RUN apk add --no-cache nodejs npm yarn

# Set environment variables for Postgres
ENV POSTGRES_DB=ynot_payload_dev
ENV POSTGRES_USER=ynot_postgres_user
ENV POSTGRES_PASSWORD=ynot_postgres_pass
ENV DATABASE_URI=postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev

# Copy application files needed for seeding
WORKDIR /app
COPY package.json yarn.lock ./
COPY payload.config.ts tsconfig.json next.config.mjs ./
COPY payload/ ./payload/
COPY src/ ./src/
COPY bin/seed-payload.ts ./bin/

# Copy initialization script
COPY bin/docker/postgres/init-seed.sh /docker-entrypoint-initdb.d/

# Make init script executable
RUN chmod +x /docker-entrypoint-initdb.d/init-seed.sh

# The init script will run automatically on first container start
# It runs Payload migrations and seeds the database

EXPOSE 5432
