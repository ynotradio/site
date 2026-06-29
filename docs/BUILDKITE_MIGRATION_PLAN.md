# Buildkite Pipelines

Buildkite runs the repository CI and scheduled maintenance pipelines from `.buildkite/`.

## Current Pipelines

| Pipeline                 | Status | Notes                                                                   |
| ------------------------ | ------ | ----------------------------------------------------------------------- |
| `pipeline.yml`           | Active | Lint, tests, build, Storybook/PHP checks as configured                  |
| `build-images.yml`       | Active | Builds/publishes agent and service images                               |
| `scheduled-db-sync.yml`  | Active | Copies prod Neon to dev Neon on schedule                                |
| `nightly-gap-report.yml` | No-op  | Retained as a placeholder; nightly imports/integrity checks are retired |

## Required Configuration

- `GHCR_USERNAME` / `GHCR_TOKEN`
- `NEON_PROD_DATABASE_URL` / `NEON_DEV_DATABASE_URL`
- Cloudinary credentials where e2e or Payload image tests need them
- `CODECOV_TOKEN` when coverage upload is enabled

## Agent Requirements

- Docker and Docker Compose
- Node.js 22 or project Docker images
- PHP 7.4 where PHP checks run outside containers
- Enough disk for Docker layer cache

See `.buildkite/README.md` for pipeline-specific commands.
