# Project Overview

[Back to Index](./README.md)

## Current Architecture

Y-Not Radio runs a legacy PHP public site plus a Payload CMS admin app.

- Public site: PHP, still hosted at `https://www.ynotradio.net/`
- Legacy control panel: `https://www.ynotradio.net/cp/`
- Payload admin: `https://ynotradio-admin.netlify.app/admin`
- Primary migrated content store: PostgreSQL/Neon managed by Payload
- Media storage: Cloudinary

## Content Ownership

Payload/Postgres owns migrated editorial content: Ads, CD of the Week, Concerts, DJs, Music, On Demand, Schedule, Posts, and Modern Rock Madness.

Legacy MySQL/admin remains for Top 11 and Year End Poll/Staff Picks until those workflows are redesigned.

## Migration Policy

- One-time import work is complete for migrated collections.
- Nightly content imports are retired.
- Nightly integrity checks are retired.
- Future content edits should happen in Payload unless the workflow is explicitly still legacy.

## Remaining Migration Work

1. Top 11 data model and admin workflow.
2. Year End Poll voting/admin workflow.
3. Staff Picks workflow.
4. Public-site redesign.
