#!/bin/sh
# deploy.sh
set -e

sudo apt-get install -y lftp

# deployment via ftp upload. Using FTPS for that
lftp -c "open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST:21; mirror -eRv . .; --exclude functions/main_fns.php; quit;"