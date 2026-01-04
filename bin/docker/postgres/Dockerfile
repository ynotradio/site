# Dockerfile for PostgreSQL for Payload data
# This is a simple Postgres 16 image for local development
# Seeding happens externally via docker-compose or manual `yarn seed:payload`
FROM postgres:16-alpine

# Set environment variables for Postgres
ENV POSTGRES_DB=ynot_payload_dev
ENV POSTGRES_USER=ynot_postgres_user
ENV POSTGRES_PASSWORD=ynot_postgres_pass

EXPOSE 5432

# Note: For pre-seeded data, see docker-compose.yml which mounts
# initialization scripts that can seed the database on first start

