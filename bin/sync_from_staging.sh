#!/bin/bash

REMOTE_HOST="$1@146.20.39.201"
REMOTE_MYSQL_HOST="127.0.0.1"
REMOTE_MYSQL_DB="ynotradio_dev_wp"
REMOTE_MYSQL_USER="ynotradio_dev_wp_user"
REMOTE_MYSQL_PASS=$2
REMOTE_BASE_URL="ynotradio.dev.thinkbrownstone.com"

LOCAL_MYSQL_HOST="localhost"
LOCAL_MYSQL_DB="ynotradio_dev"
LOCAL_MYSQL_USER="wp"
LOCAL_MYSQL_PASS="wp"
LOCAL_BASE_URL="ynotradio.dev"

TIMESTAMP="$(date +"%Y%m%d%H%M%S")"

# Check for REMOTE_HOST user argument, exit if not provided
if [ -z "$1" ]; then
  echo "Please supply the REMOTE_HOST ssh user. e.g. ./sync_staging.sh [REMOTE_HOST]"
  exit 1
fi

# Check for REMOTE_MYSQL_PASS argument, exit if not provided
if [ -z "$2" ]; then
  echo "Please supply the REMOTE_MYSQL_PASS. e.g. ./sync_staging.sh [REMOTE_MYSQL_PASS]"
  exit 1
fi

# Check for currently running sync process, exit if one is detected.
if [[ `eval ssh $REMOTE_HOST 'test -e ~/media.tmp.tar.gz && echo exists'` == *exists* ]] || [[ `test -e ~/$REMOTE_MYSQL_DB.tmp.sql && echo exists` == *exists* ]]; then
  echo "Backup is currently being executed by another process. Please try again in a few moments."
  exit 1
fi

# Create backup of local database
echo "Backing up local database..."
mkdir -p ~/tmp
mysqldump -u $LOCAL_MYSQL_USER -h $LOCAL_MYSQL_HOST -p$LOCAL_MYSQL_PASS $LOCAL_MYSQL_DB > ~/tmp/$TIMESTAMP.$LOCAL_MYSQL_DB.bak.sql

echo "Creating backup of remote database..."
eval ssh $REMOTE_HOST 'mysqldump -h '$REMOTE_MYSQL_HOST' -u '$REMOTE_MYSQL_USER' -p'$REMOTE_MYSQL_PASS' '$REMOTE_MYSQL_DB' > ~/tmp/'$REMOTE_MYSQL_DB'.tmp.sql' # &> /dev/null

echo "Updating base URL references in database..."
sed "s/$REMOTE_BASE_URL/$LOCAL_BASE_URL/g" ~/tmp/$REMOTE_MYSQL_DB.tmp.sql > ~/tmp/$REMOTE_MYSQL_DB.tmp.new.sql

echo "Importing updated remote into local database..."
mysql -u $LOCAL_MYSQL_USER -h $LOCAL_MYSQL_HOST -p$LOCAL_MYSQL_PASS $LOCAL_MYSQL_DB < ~/tmp/$REMOTE_MYSQL_DB.tmp.new.sql &> /dev/null

echo "Cleaning up..."
rm ~/tmp/$REMOTE_MYSQL_DB.tmp*

# Rsync uploads directory
echo "Syncing remote WordPress uploads..."
rsync -avz --progress $REMOTE_HOST:/var/www/html/ynotradio-STAGING-DIRECTORY/public_html/wp-content/uploads/ /vagrant/www/ynotradio/site/htdocs/wp-content/uploads

# Rsync plugins directory
echo "Syncing remote WordPress plugins..."
rsync -avz --progress $REMOTE_HOST:/var/www/html/ynotradio-STAGING-DIRECTORY/public_html/wp-content/plugins/ /vagrant/www/ynotradio/site/htdocs/wp-content/plugins

