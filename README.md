# Y-Not Radio #

----------------

## Development Options

There are two ways to set up a development environment for this site:

### Option 1: GitHub Codespaces (Recommended)

The simplest way to get started:

1. Visit the [Y-Not Radio GitHub repository](https://github.com/ynotradio/site)
2. Click the "Code" button and select the "Codespaces" tab
3. Click "Create codespace on main" to launch a new development environment
4. Once the Codespace loads, open a terminal and run:
   ```
   docker-compose up
   ```
5. When the containers are running, the site will be available at the forwarded port (typically accessible via the "Ports" tab)

### Option 2: Local Development Environment

If you prefer local development:

#### Requirements

- [Install Docker Community Edition](https://www.docker.com/community-edition)
- Windows users will need to [configure Docker to access local drives](https://rominirani.com/docker-on-windows-mounting-host-directories-d96f3f056a2c)

#### Installation

- Clone this repository to your local machine: `git clone git@github.com:ynotradio/site.git`
- In your terminal, `cd` to the root of this project directory
- Copy `src/partials/.env.example` to `src/partials/.env` and configure the environment variables:
  ```
  cp src/partials/.env.example src/partials/.env
  ```
- Replace `/src/db/docker/ynot_db.sql` with the latest copy of the YNotRadio.net MySQL database.
- Run `docker-compose up` to build the Docker images and run the [Apache, PHP and MySQL](https://docs.bitnami.com/containers/how-to/create-amp-environment-containers/) services
- Once the installation is finished, a site will be available for you to visit at: [http://localhost:8080](http://localhost:8080)

### Docker Tips

If you would like to run Docker without seeing the terminal output, use `docker-compose up -d` to run the containers in the background. Some helpful documentation about `docker-compose` can be found in the [Docker Docs](https://docs.docker.com/compose/reference/overview/#command-options-overview-and-help).

If you run into challenges with a Docker container, this is a [helpful cheatsheet for removing images and volumes](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes) before starting over.

## For GitHub Copilot Agents

If you're a GitHub Copilot agent working on this repository, please read the **[Agent Verification Guide](docs/AGENT_VERIFICATION.md)** for step-by-step instructions on how to verify your changes work with both the Payload CMS instance and the legacy PHP/MySQL site.

Quick verification commands:
- **Verify Payload CMS**: `npm run verify:payload` or `./bin/agent-helpers/verify-payload.sh`
- **Verify Legacy Site**: `npm run verify:legacy` or `./bin/agent-helpers/verify-legacy.sh`

## Development

### PHP Linting

- From the root of the project, use `docker run --rm --volume $(pwd):/app vfac/php7compatibility 7.4 ./src -d memory_limit=1G --extensions=php` to see errors in the PHP code.

### Database

#### Local Development
Access PHPMyAdmin in local development by visiting [http://localhost:8181](http://localhost:8181)

#### GitHub Codespaces
In GitHub Codespaces, PHPMyAdmin will be available on the forwarded port (typically port 8181). Click on the "Ports" tab in your Codespaces environment and look for the PHPMyAdmin link.

## Teardown

### Local Environment
- When you are finished with local development, run `docker-compose down` from your terminal to halt the containers.

### GitHub Codespaces
- For Codespaces, you can either:
  - Stop the Docker containers using `docker-compose down`
  - Stop the Codespace by clicking on the "Codespaces" menu in the bottom left corner and selecting "Stop Current Codespace"
  - Codespaces will automatically shut down after a period of inactivity

## Support

Please [open an issue](https://github.com/ynotradio/site/issues) for support.

## Contributing

Please contribute using [Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow). Create a branch, add commits, and [open a pull request](https://github.com/ynotradio/site/pulls).

Branch names should follow the following formats:

- New features / additions: `feature/new-feature-name`
- Bugfixes: `fix/bugfix-description`
- Releases: `release/release-2.0.0`

If you solve a tricky bug, the next person who works on this codebase will appreciate you including a Stack Overflow or Github Issue link to help understand why the change was made!

### Continuous Integration

The repository uses GitHub Actions for CI. The following checks run on every pull request:

- **Lint**: Runs ESLint on TypeScript/JavaScript code
- **Test**: Runs the Vitest test suite with coverage
- **PHP Lint**: Runs PHP_CodeSniffer to check PHP code style

All CI checks must pass before a pull request can be merged.

## Deployment to Lightsail

- **Deploy:**
  ```sh
  composer deploy
  ```
  This runs the deployment script (`bin/deploy.sh`).

- **Rollback:**
  ```sh
  composer rollback
  ```
  This runs the rollback script (`bin/rollback.sh`).

The script definitions are in the `scripts` section of `src/composer.json`.

## Payload CMS Migration

This project is being migrated from the legacy PHP/MySQL site to Payload CMS.

See [docs/payload-migration/](docs/payload-migration/) for the migration planning documentation.

### Working with Payload Locally

1. Run `cp .env.example .env.local` and update the Neon `DATABASE_URI`, `PAYLOAD_SECRET`, and Cloudinary placeholders.
2. Run `npm install` (once) and start the admin server with `npm run payload:dev`.
3. Visit [http://localhost:3000/admin](http://localhost:3000/admin) to confirm you can create users, upload media, and run `npm run payload:migrate`.

For production, Netlify will execute `npm run payload:build` using the settings defined in `netlify.toml`. Configure the Neon production connection string, `PAYLOAD_SECRET`, and other secrets inside the Netlify dashboard so the serverless function (`netlify/functions/payload.ts`) can boot against Neon.
