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
- Replace `/src/db/docker/ynot_db.sql` with the latest copy of the YNotRadio.net MySQL database.
- Run `docker-compose up` to build the Docker images and run the [Apache, PHP and MySQL](https://docs.bitnami.com/containers/how-to/create-amp-environment-containers/) services
- Once the installation is finished, a site will be available for you to visit at: [http://localhost:8080](http://localhost:8080)

### Docker Tips

If you would like to run Docker without seeing the terminal output, use `docker-compose up -d` to run the containers in the background. Some helpful documentation about `docker-compose` can be found in the [Docker Docs](https://docs.docker.com/compose/reference/overview/#command-options-overview-and-help).

If you run into challenges with a Docker container, this is a [helpful cheatsheet for removing images and volumes](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes) before starting over.

## Development

### PHP Linting

- From the root of the project, use `docker run --rm --volume $(pwd):/app vfac/php7compatibility 7.4 ./src -d memory_limit=1G --extensions=php` to see errors in the PHP code.

### Database

#### Local Development
Access PHPMyAdmin in local development by visiting [http://localhost:8181](http://localhost:8181)

#### GitHub Codespaces
In GitHub Codespaces, PHPMyAdmin will be available on the forwarded port (typically port 8181). Click on the "Ports" tab in your Codespaces environment and look for the PHPMyAdmin link.

## Teardown

- When you are finished development, run `docker-compose down` from your terminal to halt the containers.

## Support

Please [open an issue](https://github.com/ynotradio/site/issues) for support.

## Contributing

Please contribute using [Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow). Create a branch, add commits, and [open a pull request](https://github.com/ynotradio/site/pulls).

Branch names should follow the following formats:

- New features / additions: `feature/new-feature-name`
- Bugfixes: `fix/bugfix-description`
- Releases: `release/release-2.0.0`

If you solve a tricky bug, the next person who works on this codebase will appreciate you including a Stack Overflow or Github Issue link to help understand why the change was made!
