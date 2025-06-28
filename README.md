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

## Development

### Data Migration Tools

This project includes TypeScript-based migration tools to help move data from the legacy MySQL database to Sanity CMS.

#### Deejay Migration

The `import:deejays` script migrates deejay data from the MySQL database to Sanity CMS as "person" documents:

1. Make sure you have Node.js and npm installed
2. Install dependencies at the project root:
   ```
   npm install
   ```
3. Configure environment variables in one of the following locations:
   - Create `bin/migrations/.env` with database and Sanity credentials
   - Update credentials in `src/partials/.env`
   - The script will use default values from settings.json if no .env file is found
4. Run the migration script:
   ```
   npm run import:deejays
   ```

The script runs TypeScript directly using tsx, with no build step required.

The script will:
- Connect to the MySQL database
- Query all active deejays
- Transform data to the Sanity format
- Upload images to Sanity as assets
- Create person documents in Sanity with proper image references
- Handle special formatting for slugs, bios, and social links

#### Migration Script Configuration

Database connection details:
```
DB_NAME=ynot_site
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
```

Sanity configuration:
```
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_token
```

#### Sanity API Token Permissions

The Sanity API token used for migration **must** have the following permissions:

- **create** permission for documents
- **create** permission for assets

To create a new token with these permissions:

1. Go to [manage.sanity.io](https://manage.sanity.io)
2. Select your project
3. Go to API > Tokens
4. Click "Add API token"
5. Give it a name (e.g., "Import Token")
6. Set permissions to include:
   - Editor (gives read/write access to documents)
   - Asset write (allows uploading images)
7. Copy the token and add it to your `.env` file

Without these permissions, you'll see "403 Forbidden" errors during the import process.

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

## Sanity CMS Migration

This project is being migrated from the legacy PHP/MySQL site to Sanity CMS.

### Sanity Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Run the Sanity development server:
   ```
   npm run sanity:dev
   ```
   
   This will start the Sanity Studio at http://localhost:3333

### MCP Server Setup

To use the Sanity MCP server in VS Code:

1. Create a management token at:
   ```
   https://www.sanity.io/manage/project/otcmx0q6/api
   ```
   
   - Go to the "API" tab
   - Click "Add API token"
   - Give it a name like "MCP Server"
   - Set the permissions to "Editor" or higher
   - Copy the token

2. Update `.vscode/settings.json` with your token:
   - Find the `copilot.mcp.servers.sanity.env.SANITY_API_TOKEN` property
   - Replace `YOUR_SANITY_TOKEN_HERE` with the actual token

3. Restart VS Code to load the MCP server configuration.

4. Now you can use GitHub Copilot to interact with your Sanity content using natural language.

### Content Models

#### Person

A simple model representing a person, with fields:
- name (string, required)
- slug (slug, required, generated from name)
- photo (image with hotspot)
- bio (rich text)

More models will be added in future phases of the migration.
