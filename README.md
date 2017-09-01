# Y-Not Radio #
----------------

## Setup ##

**Required**

* [Install Vagrant](https://www.vagrantup.com/downloads.html)

* [Install Composer](https://getcomposer.org/download/) - make sure to [set it up globally](https://getcomposer.org/doc/00-intro.md#globally)

**Recommended**

[Install VVV Dashboard](https://github.com/leogopal/VVV-Dashboard)

Run these commands from the `vvv/www` directory.

    git clone git@github.com:leogopal/VVV-Dashboard.git VVV-Dash-Files-tmp
    sudo ditto VVV-Dash-Files-tmp/dashboard default/dashboard/
    sudo ditto VVV-Dash-Files-tmp/dashboard-custom.php default/dashboard-custom.php
    sudo rm -rf VVV-Dash-Files-tmp

### Preliminary ###
-------------------

Checkout the VVV repository into your HOME or preferred working directory

    cd $HOME
    git clone https://github.com/Varying-Vagrant-Vagrants/VVV.git vvv

Install VVV (this will take some time)

	cd vvv
	vagrant up


### Install this Repository ###

Clone this repo to your `vvv/www` folder. You will be working out of this folder.

	git clone git@github.com:ynotradio/site.git ynotradio

### Register New VVV Site

Copy the file `vvv/vvv-config.yml`, save it as `vvv/vvv-custom.yml`, and add a new site entry for `ynotradio`:

	sites:
	  ynotradio:

This ensures the provisioning script for the site will be run by Vagrant.

### Installation Script ###
---------------------------

On your local machine, change your working directory to vvv/www/ynotradio

* Run this `./bin/install.sh`
* Then this `vagrant up --provision`

If your vagrant box is already up, and you're not seeing the WordPress installation complete, try:
* `vagrant reload --provision`

## URLS ##
----------

[VVV Dashboard](http://vvv.dev/)

[ynotradio.dev](http://ynotradio.dev/)

## Commands ##
--------------

To halt the vagrant box run

	vagrant halt

To run it up again run

	vagrant up

To delete the box run

	vagrant destroy

To ssh into the box

	vagrant ssh

## Usernames and  Passwords
---------------------------

To access the back-end of WP & MySQL the logins are below:

### WordPress WP-Admin credentials are

	admin
	admin

### MySQL db and dbUser is

	wp
	wp

### MySQL root user is

	root
	root

## Development Workflow ##
--------------------------

### Importing Database Changes ###

SSH into Vagrant and run `./bin/load-db.sh` *command needs to be run from the `/srv/www/ynotradio` directory*


### Syncing Database / wp-content Changes from staging ###

SSH into Vagrant and run `./bin/sync_from_staging.sh staging_username mysql_db_password` *command needs to be run from the `/srv/www/ynotradio` directory*

### Exporting Database Changes ###

SSH into Vagrant and run `./bin/dump-db.sh` *command needs to be run from the `/srv/www/ynotradio` directory*