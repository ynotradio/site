SITE_NAME="ynotradio"
DB_NAME=$SITE_NAME"_dev"

echo "Commencing $SITE_NAME Setup..."
# Make a database, if we don't already have one
echo -e "\nCreating database '$DB_NAME' (if it's not already there)"
mysql -u root --password=root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME"
mysql -u root --password=root -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO wp@localhost IDENTIFIED BY 'wp';"
echo -e "\n DB operations done.\n\n"

db_populated=`mysql -u root -proot --skip-column-names -e "SHOW TABLES FROM $DB_NAME"`
if [ "" == "$db_populated" ]; then
	echo "Loading $DB_NAME.sql..."
	mysql -u root -proot $DB_NAME < /srv/www/$SITE_NAME/database/$DB_NAME.sql
fi

# Nginx Logs
echo -e "\nCreating NGINX Logs.."
if [[ ! -d /srv/log/$SITE_NAME ]]; then
	mkdir /srv/log/$SITE_NAME
fi
	touch /srv/log/$SITE_NAME/error.log
	touch /srv/log/$SITE_NAME/access.log

# Run Composer
cd /srv/www/$SITE_NAME/site
composer install --prefer-dist
composer update
cd -  > /dev/null

# Link theme to wp-content directory
if [[ ! -L "/srv/www/$SITE_NAME/site/htdocs/wp-content/themes/$SITE_NAME" ]]
then
	echo "Creating sym link to $(SITE_NAME) theme"
	ln -s /srv/www/$SITE_NAME/site/theme /srv/www/$SITE_NAME/site/htdocs/wp-content/themes/$SITE_NAME
fi

# Link plugins to wp-content directory
cd /srv/www/$SITE_NAME/plugins && for i in `ls `;
do
    if [[ ! -L "/srv/www/$SITE_NAME/site/htdocs/wp-content/plugins/$i" ]]
    then
        echo "Creating sym link to plugin $i"
        ln -s /srv/www/$SITE_NAME/site/plugins/$i /srv/www/$SITE_NAME/site/htdocs/wp-content/plugins/$i;
    fi
done

# Copy config settings to new site
echo "Copying wp-config to htdocs"
cp /srv/www/$SITE_NAME/site/config/wp-config.php /srv/www/$SITE_NAME/site/htdocs

# The Vagrant site setup script will restart Nginx for us

echo "$SITE_NAME Installed";
