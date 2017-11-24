#!/bin/sh
# deploy.sh

# compile
npm run build
# sync on staging
rsync --rsync-path="sudo -u www-data rsync" -az -vv --no-p --no-g --chmod=ugo=rwX -O -e 'ssh -p 22' ~/clone/site/theme bitnami@54.84.246.119:~/apps/beta.ynotradio.net/htdocs/wp-content/themes/ynotradio
