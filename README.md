# Y-Not Radio

---

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
- Copy `.env.example` to `.env.local` and configure the environment variables:
  ```
  cp .env.example .env.local
  ```
- Replace `/src/db/docker/ynot_db.sql` with the latest copy of the YNotRadio.net MySQL database.
- Run `docker-compose up` to build the Docker images and run the [Apache, PHP and MySQL](https://docs.bitnami.com/containers/how-to/create-amp-environment-containers/) services
- Once the installation is finished, a site will be available for you to visit at: [http://localhost:8080](http://localhost:8080)

### Docker Tips

If you would like to run Docker without seeing the terminal output, use `docker-compose up -d` to run the containers in the background. Some helpful documentation about `docker-compose` can be found in the [Docker Docs](https://docs.docker.com/compose/reference/overview/#command-options-overview-and-help).

If you run into challenges with a Docker container, this is a [helpful cheatsheet for removing images and volumes](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes) before starting over.

## For GitHub Copilot Agents

**👋 Working on this codebase as an automated agent?**

**Start here:** [Testing PR Changes Skill](.claude/skills/testing-pr-changes/SKILL.md) ⭐ **Required reading**

This skill provides:

- ✅ Clear success criteria (screenshots, performance baselines)
- 🔄 Incremental verification strategy
- 🚨 When to stop and report blockers
- 📋 Fallback strategies when full testing isn't possible

**Quick commands to verify your work:**

```bash
# Test Payload CMS
yarn payload:dev
yarn seed:payload  # Sample data for testing
# → Open http://localhost:3000/admin and take screenshot
# → Login credentials are pre-filled in development (just click login)

# Test legacy site
docker compose up -d
yarn seed:legacy  # Sample data for testing
# Or: ./bin/refresh_local.sh for production data
# → Open http://localhost:8080 and take screenshot

# Run tests
yarn test && yarn lint

# Run end-to-end tests
yarn test:e2e
```

**Context:**

- [Project Status](docs/PROJECT_STATUS.md) - Current state and priorities
- [Migration Overview](docs/payload-migration/README.md) - PHP→Payload migration strategy
- [Core Data Models](docs/payload-migration/03-core-data-models.md) - Collection schemas

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

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**For GitHub Copilot Agents:** Read [Testing PR Changes Skill](.claude/skills/testing-pr-changes/SKILL.md) and [Project Status](docs/PROJECT_STATUS.md) before starting work.

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
- **E2E Tests**: Runs Playwright end-to-end tests with containerized services
- **Storybook Build**: Ensures Storybook can build successfully
- **PHP Lint**: Runs PHP_CodeSniffer to check PHP code style

All CI checks must pass before a pull request can be merged.

### Testing

#### Unit Tests (Vitest)

Unit tests are located in `**/*.test.ts` and `**/*.test.tsx` files throughout the codebase.

```bash
# Run all unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

#### End-to-End Tests (Playwright)

E2E tests verify the integration between Payload CMS and the legacy PHP site using containerized databases.

```bash
# Run E2E tests (headless)
yarn test:e2e

# Run E2E tests with UI (interactive)
yarn test:e2e:ui

# Run E2E tests in headed mode (see browser)
yarn test:e2e:headed
```

The E2E tests automatically:

1. Start Docker Compose services (MySQL, Postgres, PHP, Apache)
2. Wait for services to be healthy
3. Seed databases with test data
4. Run Playwright tests
5. Clean up Docker services

See [e2e/README.md](e2e/README.md) for detailed documentation.

**Note:** E2E tests require Docker to be installed and running.

### Storybook

Storybook is available for developing and testing UI components in isolation.

#### Running Storybook

To run Storybook in development mode:

```bash
yarn storybook
```

This will start Storybook at [http://localhost:6006](http://localhost:6006).

#### Building Storybook

To build a static version of Storybook:

```bash
yarn build-storybook
```

The static files will be generated in the `storybook-static` directory.

#### Creating Stories

Stories should be colocated with your components in the same directory. To create a new story:

1. Create a React component (e.g., `app/components/MyComponent.tsx`)
2. Create a corresponding story file next to it (e.g., `app/components/MyComponent.stories.tsx`)
3. Define your component variants as stories

Example story structure:

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // component props
  },
};
```

See `app/components/ExampleButton.stories.tsx` for a complete example.

For more information, see the [Storybook documentation](https://storybook.js.org/docs).

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
2. Run `yarn install` (once) and start the admin server with `yarn payload:dev`.
3. Visit [http://localhost:3000/admin](http://localhost:3000/admin) to confirm you can create users, upload media, and run `yarn payload:migrate`.

For production, Netlify will execute `yarn payload:build` using the settings defined in `netlify.toml`. Configure the Neon production connection string, `PAYLOAD_SECRET`, and other secrets inside the Netlify dashboard so the serverless function (`netlify/functions/payload.ts`) can boot against Neon.

### Database Management

To copy one Neon database to another (e.g., production to development for testing):

```bash
yarn neon-db:copy prod dev
```

**Note:** This will completely replace the target database. A weekly automated sync from production to development runs every Monday at 2 AM UTC.
