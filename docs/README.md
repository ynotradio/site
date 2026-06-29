# Documentation Index

**Last Updated:** June 2026

## Start Here

- [Repository README](../README.md) - local setup and common commands
- [Project Status](PROJECT_STATUS.md) - current production state and remaining work
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - required local/production config
- [Deployment Safety](DEPLOYMENT_SAFETY.md) - deployment checks
- [Buildkite Pipelines](BUILDKITE_MIGRATION_PLAN.md) - active CI and scheduled pipelines

## Payload and Legacy Site

- [Payload Migration Overview](payload-migration/README.md) - current CMS architecture
- [Core Data Models](payload-migration/03-core-data-models.md) - collection reference
- [PHP PostgreSQL Querying](payload-migration/03.5-php-postgresql-querying.md) - PHP read-model patterns
- [Payload Admin Customization](PAYLOAD_ADMIN_CUSTOMIZATION.md) - custom admin UI features
- [Read-Only Collections](READONLY_COLLECTIONS.md) - legacy PHP models backed by Payload/Postgres

## Feature References

- [Modern Rock Madness](archive/php-mvc-migration/MRM_MIGRATION_REPORT.md) - historical PHP refactor notes
- [Year End Poll Results](payload-migration/13-year-end-poll-results.md) - current Payload result model
- [Embed Feature](EMBED_FEATURE.md) - custom Lexical embeds
- [On Demand API](ON_DEMAND_API.md) - On Demand behavior and API notes
- [Cloudinary Integration](payload-migration/12-cloudinary-integration.md) - media storage

## Retired / Historical

- [Incremental Import](incremental-import.md) - retired; nightly imports are disabled
- [Archive Index](archive/README.md) - completed implementation notes and old investigations
- [Payload Migration Planning](payload-migration/04-migration-tasks.md) - historical implementation checklist

## Agent References

- [Testing PR Changes Skill](../.claude/skills/testing-pr-changes/SKILL.md)
- [Payload Skill](../.claude/skills/payload/SKILL.md)
- [Payload Migration Workflow Skill](../.claude/skills/payload-migration-workflow/SKILL.md)
- [Agent Automation Infrastructure](../.claude/skills/agent-automation-infrastructure/SKILL.md)
