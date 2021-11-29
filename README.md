# Y-Not Radio #
----------------

## Requirements
To spin up a working copy of this site on your local machine, you'll need a few important pieces before getting started:

- [Install Docker Community Edition](https://www.docker.com/community-edition)
- Windows users will need to [configure Docker to access local drives](https://rominirani.com/docker-on-windows-mounting-host-directories-d96f3f056a2c)

## Installation
- Clone this repository to your local machine: `git clone git@github.com:ynotradio/site.git`
- In your terminal, `cd` to the root of this project directory
- Replace `/src/db/docker/ynot_db.sql` with the latest copy of the YNotRadio.net MySQL database.
- Run `docker-compose up` to build the Docker images and run the [https://docs.bitnami.com/containers/how-to/create-amp-environment-containers/](Apache, PHP and MySQL) services
- Once the installation is finished, a site will be available for you to visit at: [http://localhost:8080](http://localhost:8080)

If you would like to run Docker without seeing the terminal output, use `docker-compose up -d` to run the containers in the background. Some helpful documentation about `docker-compose` can be found in the [Docker Docs](https://docs.docker.com/compose/reference/overview/#command-options-overview-and-help).

If you run into challenges with a Docker container, this is a [helpful cheatsheet for removing images and volumes](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes) before starting over. 

## Development

### PHP Linting
- From the root of the project, use `docker run --rm --volume $(pwd):/app vfac/php7compatibility 7.4 ./src -d memory_limit=1G --extensions=php` to see errors in the PHP code.

### Database
Access PHPMyAdmin in development by visiting [http://localhost:8181](http://localhost:8181)

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
