#!/bin/sh
# deploy.sh
set -e

sudo apt-get install -y lftp

# deployment via ftp upload. Using FTPS for that
lftp -c "set net:max-retries 2;set net:reconnect-interval-base 5;set net:reconnect-interval-multiplier 1; open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST:21; cd public; mirror --reverse --parallel=20 --verbose --exclude functions/main_fns.php; quit;"