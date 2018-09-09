# Y-Not Radio #
----------------

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Development](#development)
- [Teardown](#teardown)
- [Support](#support)
- [Contributing](#contributing)

## Requirements
To spin up a working copy of this WordPress site on your local machine, you'll need a few important pieces before getting started:

- [Install Docker Community Edition](https://www.docker.com/community-edition)
- [Install Node.js LTS](https://nodejs.org/en/download/)
    - or use [nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows)
- Windows users will need to [Install Ruby](https://rubyinstaller.org/) and run `gem install sass`
- Windows users will need to [configure Docker to access local drives](https://rominirani.com/docker-on-windows-mounting-host-directories-d96f3f056a2c)

## Installation
- Clone this repository to your local machine: `git clone git@github.com:ynotradio/site.git`
- In your terminal, `cd` to the root of this project directory
- Run `npm install` to install Node dependencies and build the site
- Run `npm start` to pull and build the Docker images
- Once the installation is finished, a site will be available for you to visit at: [http://localhost:8000](http://localhost:8000)

If you would like to run Docker without `npm` or BrowserSync, use `docker-compose up -d` to run the containers in the background. If you wish to see a verbose, trailing output from your Docker containers in the foreground, use `docker-compose up`. Some helpful documentation about `docker-compose` can be found in the [Docker Docs](https://docs.docker.com/compose/reference/overview/#command-options-overview-and-help).

If you run into challenges with a Docker container, this is a [helpful cheatsheet for removing images and volumes](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes) before starting over. 

## Development

### Theme Files
You can find the WordPress theme contents -- including images, JavaScript, PHP templates, and SCSS -- in the `site/theme` directory of this project. When you edit these, you should see your changes automatically synced at [http://localhost:8000](http://localhost:8000).

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

