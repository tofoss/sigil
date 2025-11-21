#!/bin/bash

# Full backup script
# Backs up PostgreSQL database and uploads Docker volumes with 7-day retention

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$HOME/org-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_BACKUP_FILE="$BACKUP_DIR/org_db_$TIMESTAMP.sql.gz"
UPLOADS_BACKUP_FILE="$BACKUP_DIR/org_uploads_$TIMESTAMP.tar.gz"

# Docker volume names (from docker-compose)
UPLOADS_VOLUME="${UPLOADS_VOLUME:-organizer_uploads_data}"

# Load environment variables if .env exists
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date)"
echo "========================================"

# Backup database from Docker container
echo ""
echo "Backing up database..."
echo "  -> $DB_BACKUP_FILE"

docker exec postgres_db pg_dump -U "${PGUSER:-postgres}" "${PGDATABASE:-org}" \
    | gzip > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ] && [ -s "$DB_BACKUP_FILE" ]; then
    SIZE=$(ls -lh "$DB_BACKUP_FILE" | awk '{print $5}')
    echo "  Database backup completed ($SIZE)"
else
    echo "  ERROR: Database backup failed!"
    exit 1
fi

# Backup uploads from Docker volume
echo ""
echo "Backing up uploads volume: $UPLOADS_VOLUME"
echo "  -> $UPLOADS_BACKUP_FILE"

docker run --rm \
    -v "$UPLOADS_VOLUME":/data:ro \
    -v "$BACKUP_DIR":/backup \
    alpine tar -czf "/backup/org_uploads_$TIMESTAMP.tar.gz" -C /data .

if [ -f "$UPLOADS_BACKUP_FILE" ] && [ -s "$UPLOADS_BACKUP_FILE" ]; then
    SIZE=$(ls -lh "$UPLOADS_BACKUP_FILE" | awk '{print $5}')
    echo "  Uploads backup completed ($SIZE)"
else
    echo "  WARNING: Uploads backup may be empty or failed"
fi

# Delete old backups
echo ""
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "org_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "org_uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Summary
echo ""
echo "========================================"
echo "Backup completed at $(date)"
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/org_*.gz 2>/dev/null || echo "  (none)"
