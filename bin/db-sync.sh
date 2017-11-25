#!/bin/bash
REMOTE_HOST=$REMOTE_SSH_ALIAS
REMOTE_MYSQL_HOST="127.0.0.1"
REMOTE_MYSQL_DB="ynotradio_wordpress"
REMOTE_MYSQL_USER="ynotradio_wp"
REMOTE_MYSQL_PASS=$REMOTE_MYSQL_PASS
REMOTE_BASE_URL="beta.ynotradio.net"
REMOTE_PATH="/opt/bitnami/apps/beta.ynotradio.net/htdocs"

LOCAL_MYSQL_HOST="192.168.50.4"
LOCAL_MYSQL_DB="ynotradio_dev"
LOCAL_MYSQL_USER="external"
LOCAL_MYSQL_PASS=$LOCAL_MYSQL_PASS
LOCAL_BASE_URL="ynotradio.dev"
LOCAL_PATH="./vm/ark.dev/public"

TIMESTAMP="$(date +"%Y%m%d%H%M%S")"

# Check for currently running sync process, exit if one is detected.
if [[ `eval ssh $REMOTE_HOST 'test -e ~/media.tmp.tar.gz && echo exists'` == *exists* ]] || [[ `test -e ~/$REMOTE_MYSQL_DB.tmp.sql && echo exists` == *exists* ]]; then
  echo "Backup is currently being executed by another process. Please try again in a few moments."
  exit 1
fi

# # Create backup of local database
echo "Backing up local database..."
mkdir -p ./tmp
mysqldump --compatible=mysql4 -h $LOCAL_MYSQL_HOST -u $LOCAL_MYSQL_USER -p$LOCAL_MYSQL_PASS $LOCAL_MYSQL_DB > ./tmp/$LOCAL_MYSQL_DB.tmp.sql

echo "Creating backup of remote database..."
eval ssh $REMOTE_HOST 'mysqldump -h '$REMOTE_MYSQL_HOST' -u '$REMOTE_MYSQL_USER' -p'$REMOTE_MYSQL_PASS' '$REMOTE_MYSQL_DB' > ./tmp/'$REMOTE_MYSQL_DB'.tmp.sql' # &> /dev/null

echo "Updating base URL references in database..."
sed "s/$REMOTE_BASE_URL/$LOCAL_BASE_URL/g" ./tmp/$REMOTE_MYSQL_DB.tmp.sql > ./tmp/$REMOTE_MYSQL_DB.tmp.new.sql

echo "Updating collation format..."
sed -e "s/utf8mb4_unicode_520_ci/utf8_unicode_ci/g" -e "s/utf8mb4/utf8/g" ./tmp/$REMOTE_MYSQL_DB.tmp.new.sql > ./tmp/$REMOTE_MYSQL_DB.tmp.collate.sql 
# https://stackoverflow.com/questions/29916610/1273-unknown-collation-utf8mb4-unicode-ci-cpanel

echo "Importing updated remote into local database..."
mysql -u $LOCAL_MYSQL_USER -h $LOCAL_MYSQL_HOST -p$LOCAL_MYSQL_PASS $LOCAL_MYSQL_DB < ./tmp/$REMOTE_MYSQL_DB.tmp.collate.sql  # &> /dev/null

# echo "Cleaning up..."
rm ./tmp/$REMOTE_MYSQL_DB.tmp*

# # Rsync uploads directory
# echo "Syncing remote WordPress uploads..."
rsync -avz --progress $REMOTE_HOST:$REMOTE_PATH/wp-content/uploads/ ./site/htdocs/wp-content/uploads

# # Rsync plugins directory
# echo "Syncing remote WordPress plugins..."
rsync -avz --progress $REMOTE_HOST:$REMOTE_PATH/wp-content/plugins/ ./site/htdocs/wp-content/plugins