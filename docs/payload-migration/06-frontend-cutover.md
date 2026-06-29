# Frontend Cutover Status

[Back to Index](./README.md)

## Current State

The PHP public site has been cut over to Payload/Postgres for migrated editorial content. The old `USE_POSTGRES_*` feature-flag rollout is retired.

## Payload/Postgres Backed

- Ads
- CD of the Week
- Concerts
- DJs
- Music records and songs
- On Demand
- Schedule
- Stories and custom text as Posts
- Modern Rock Madness

## Still Legacy MySQL/Admin

- Top 11
- Year End Poll voting/admin
- Staff Picks

## Retired

- Incremental feature-flag rollout
- Nightly MySQL-to-Postgres content sync
- Nightly integrity-check pipeline
- MySQL fallback branches for migrated read models

## Current Direction

Move remaining legacy admin workflows into Payload, then continue reducing PHP-only code. A future public-site redesign can consume Payload/Postgres directly without reintroducing sync jobs.
