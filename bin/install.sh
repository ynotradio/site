#!/bin/bash
# Setup the ynotradio.com Dev Environment
# Author: Dan Gautsch (@iamdaninphilly), Think Brownstone <http://thinkbrownstone.com>
# Contributor: Dan Grebb (@dgrebb), Think Brownstone <http://thinkbrownstone.com>
# Usage: bin/install.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Installation of the ynotradio.com development environment
echo -e "Checking for required dependencies\n"

# Check on dependencies
echo -e "Checking for composer.."
if hash composer 2>/dev/null; then
    composer --version
    printf "${GREEN}OK${NC}\n"
else
    echo >&2 "${RED}Composer is not installed. This project requires composer. Aborting.${NC}"; exit 1;
fi

echo -e "\nChecking for vagrant..."
if hash vagrant 2>/dev/null; then
    vagrant --version
    printf "${GREEN}OK${NC}\n"
else
    echo >&2 "${RED}Vagrant is not installed. This project requires Vagrant. Aborting.${NC}"; exit 1;
fi

echo -e "\nDiagnosing composer settings"
composer diagnose

echo -e "\nInstalling Vagrant Plugins...if necessary."

if vagrant plugin list | grep -q "hostsupdater"; then
  printf "${GREEN}\nvagrant-hostsupdater already installed skipping...${NC}"
else
    vagrant plugin install vagrant-hostsupdater
fi

if vagrant plugin list | grep -q "triggers"; then
  printf "${GREEN}\nvagrant-triggers already installed skipping...${NC}"
else
    vagrant plugin install vagrant-triggers
fi

echo -e "\nDone checking dependencies."

printf "\nRun ${YELLOW}vagrant up --provision${NC} to build the project.\n"
read -r -p "Would you like to run this now? [y/N] " response
if [[ $response =~ ^([yY][eE][sS]|[yY])$ ]]
then
    vagrant up --provision
else
    exit 0
fi
