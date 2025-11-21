#!/bin/bash

# Full restore script
# Restores PostgreSQL database and/or uploads from backup

set -e

# Load environment variables if .env exists
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

BACKUP_DIR="${BACKUP_DIR:-$HOME/sigil-backups}"
UPLOADS_VOLUME="${UPLOADS_VOLUME:-sigil_uploads_data}"

show_usage() {
    echo "Usage: $0 [--db <db_backup>] [--uploads <uploads_backup>]"
    echo ""
    echo "Options:"
    echo "  --db <file>       Restore database from backup"
    echo "  --uploads <file>  Restore uploads from backup"
    echo ""
    echo "Available backups in $BACKUP_DIR:"
    echo ""
    echo "Database backups:"
    ls -lh "$BACKUP_DIR"/sigil_db_*.sql.gz 2>/dev/null || echo "  (none)"
    echo ""
    echo "Upload backups:"
    ls -lh "$BACKUP_DIR"/sigil_uploads_*.tar.gz 2>/dev/null || echo "  (none)"
}

resolve_path() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "$file"
    elif [ -f "$BACKUP_DIR/$file" ]; then
        echo "$BACKUP_DIR/$file"
    else
        echo ""
    fi
}

DB_BACKUP=""
UPLOADS_BACKUP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --db)
            DB_BACKUP="$2"
            shift 2
            ;;
        --uploads)
            UPLOADS_BACKUP="$2"
            shift 2
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
done

if [ -z "$DB_BACKUP" ] && [ -z "$UPLOADS_BACKUP" ]; then
    show_usage
    exit 1
fi

echo "WARNING: This will overwrite existing data!"
echo ""
[ -n "$DB_BACKUP" ] && echo "  Database: $DB_BACKUP"
[ -n "$UPLOADS_BACKUP" ] && echo "  Uploads: $UPLOADS_BACKUP"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Restore database
if [ -n "$DB_BACKUP" ]; then
    DB_FILE=$(resolve_path "$DB_BACKUP")
    if [ -z "$DB_FILE" ]; then
        echo "ERROR: Database backup not found: $DB_BACKUP"
        exit 1
    fi

    echo ""
    echo "Restoring database from: $DB_FILE"

    # Drop and recreate database via Docker
    docker exec postgres_db psql -U "${PGUSER:-postgres}" -d postgres \
        -c "DROP DATABASE IF EXISTS ${PGDATABASE:-sigil};"

    docker exec postgres_db psql -U "${PGUSER:-postgres}" -d postgres \
        -c "CREATE DATABASE ${PGDATABASE:-sigil};"

    gunzip -c "$DB_FILE" | docker exec -i postgres_db psql -U "${PGUSER:-postgres}" -d "${PGDATABASE:-sigil}" > /dev/null

    echo "Database restored successfully!"
fi

# Restore uploads to Docker volume
if [ -n "$UPLOADS_BACKUP" ]; then
    UPLOADS_FILE=$(resolve_path "$UPLOADS_BACKUP")
    if [ -z "$UPLOADS_FILE" ]; then
        echo "ERROR: Uploads backup not found: $UPLOADS_BACKUP"
        exit 1
    fi

    echo ""
    echo "Restoring uploads from: $UPLOADS_FILE"
    echo "  -> volume: $UPLOADS_VOLUME"

    # Clear volume and restore
    docker run --rm \
        -v "$UPLOADS_VOLUME":/data \
        -v "$BACKUP_DIR":/backup \
        alpine sh -c "rm -rf /data/* && tar -xzf /backup/$(basename "$UPLOADS_FILE") -C /data"

    echo "Uploads restored successfully!"
fi

echo ""
echo "Restore completed!"
