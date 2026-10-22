#!/bin/bash
# Paste as the Lightsail launch script (Ubuntu LTS). Lightsail runs it as a shell script, not cloud-config.
# Secrets (/opt/ynot/.env, /opt/ynot/mysql.env) are added by hand afterwards; see README.md.
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 git
systemctl enable --now docker

mkdir -p /opt/ynot/backups
[ -d /opt/ynot/site ] || git clone https://github.com/ynotradio/site.git /opt/ynot/site

cat > /opt/ynot/backup-mysql.sh <<'SCRIPT'
#!/bin/sh
set -eu
mkdir -p /opt/ynot/backups
docker exec prod-mysql-1 sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --all-databases' \
  | gzip > "/opt/ynot/backups/mysql-$(date +%F).sql.gz"
find /opt/ynot/backups -name 'mysql-*.sql.gz' -mtime +14 -delete
SCRIPT
chmod 755 /opt/ynot/backup-mysql.sh

echo '15 3 * * * root /opt/ynot/backup-mysql.sh' > /etc/cron.d/ynot-mysql-backup
