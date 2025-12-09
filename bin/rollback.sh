#!/bin/bash
# rollback.sh
set -e

echo "🔄 Starting rollback process..."

# Get list of backups
echo "📋 Available backups:"
BACKUPS=$(ssh ynotradio "ls -1 ~/backups/htdocs/htdocs_backup_*.tar.gz 2>/dev/null | sort -r")
if [ -z "$BACKUPS" ]; then
    echo "❌ No backups found!"
    exit 1
fi

# Display backups with numbers
echo "$BACKUPS" | nl

# Get user selection
read -p "Enter the number of the backup to restore (or 'q' to quit): " selection

# Handle quit
if [ "$selection" = "q" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Validate selection
if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
    echo "❌ Invalid selection"
    exit 1
fi

# Get the selected backup file
BACKUP_FILE=$(echo "$BACKUPS" | sed -n "${selection}p")
if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Invalid backup selection"
    exit 1
fi

# Confirm with user
echo "⚠️  You are about to restore from: $(basename "$BACKUP_FILE")"
echo "This will replace the current htdocs directory with the backup contents."
read -p "Are you sure you want to continue? (y/N): " confirm

if [ "$confirm" != "y" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Perform the rollback
echo "🔄 Restoring backup..."
ssh ynotradio "set -x && \
    echo 'Clearing htdocs directory...' && \
    sudo rm -rf /opt/bitnami/apache2/htdocs/* && \
    echo 'Creating temporary directory...' && \
    mkdir -p ~/temp_restore && \
    echo 'Extracting backup...' && \
    tar -xzf "$BACKUP_FILE" -C ~/temp_restore && \
    echo 'Checking extracted contents...' && \
    ls -la ~/temp_restore/ && \
    echo 'Copying files to htdocs...' && \
    sudo cp -rv ~/temp_restore/* /opt/bitnami/apache2/htdocs/ && \
    echo 'Cleaning up...' && \
    rm -rf ~/temp_restore && \
    echo 'Fixing permissions...' && \
    sudo chown -R daemon:daemon /opt/bitnami/apache2/htdocs/ && \
    sudo find /opt/bitnami/apache2/htdocs/ -type d -exec chmod 775 {} \; && \
    sudo find /opt/bitnami/apache2/htdocs/ -type f -exec chmod 664 {} \; && \
    echo 'Verifying htdocs contents...' && \
    ls -la /opt/bitnami/apache2/htdocs/"

echo "✅ Rollback complete! The site has been restored from: $(basename "$BACKUP_FILE")" 