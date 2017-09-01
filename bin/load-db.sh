#!/usr/bin/env bash
PROJECT_NAME="ynotradio"

LOCAL_MYSQL_HOST="$PROJECT_NAME.dev"
LOCAL_MYSQL_DB="$PROJECT_NAME_dev"
LOCAL_MYSQL_USER="external"
LOCAL_MYSQL_PASS="external"
DATABASE_PATH="./database"
TIMESTAMP="$(date +"%Y%m%d%H%M%S")"

# Change info and path if you are in Vagrant

if [ $USER = 'vagrant' ]; then
    LOCAL_MYSQL_HOST="localhost"
    LOCAL_MYSQL_USER="root"
    LOCAL_MYSQL_PASS="root"
    DATABASE_PATH="/srv/www/$PROJECT_NAME/database"
fi
echo $DATABASE_PATH/$LOCAL_MYSQL_DB.sql;

if [ -f $DATABASE_PATH/$LOCAL_MYSQL_DB.sql ]; then

    # Grab SQL file and import it
    echo "Importing the new $LOCAL_MYSQL_DB database..."
    mysql -u $LOCAL_MYSQL_USER -h $LOCAL_MYSQL_HOST -p$LOCAL_MYSQL_PASS $LOCAL_MYSQL_DB < $DATABASE_PATH/$LOCAL_MYSQL_DB.sql

    echo "Setting $PROJECT_NAME admin password..."
    cd /srv/www/$PROJECT_NAME/site/htdocs > /dev/null
    wp user update 1 --user_pass=admin
    echo "Changing $PROJECT_NAME site url..."
    wp option update home "http://$PROJECT_NAME.dev"
    wp option update siteurl "http://$PROJECT_NAME.dev"
    cd - > /dev/null

fi
