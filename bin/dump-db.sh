#!/usr/bin/env bash

PROJECT_NAME="ynotradio"

LOCAL_MYSQL_HOST="$PROJECT_NAME.dev"
LOCAL_MYSQL_DB="$PROJECT_NAME_dev"
LOCAL_MYSQL_USER="external"
LOCAL_MYSQL_PASS="external"
DATABASE_PATH="./database"

# Change info and path if you are in Vagrant

if [ $USER = 'vagrant' ]; then
	LOCAL_MYSQL_HOST="localhost"
	LOCAL_MYSQL_USER="root"
	LOCAL_MYSQL_PASS="root"
	DATABASE_PATH="/srv/www/$PROJECT_NAME/database"
fi

echo "Backing up the local database '$LOCAL_MYSQL_DB'... to '$DATABASE_PATH'"
mkdir -p $DATABASE_PATH
mysqldump -u $LOCAL_MYSQL_USER -h $LOCAL_MYSQL_HOST -p$LOCAL_MYSQL_PASS $LOCAL_MYSQL_DB > $DATABASE_PATH/$LOCAL_MYSQL_DB.sql

