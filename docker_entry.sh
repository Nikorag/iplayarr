#!/bin/sh
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}
USERNAME="iplayarr"

echo "Starting container with UID:$PUID and GID:$PGID"

EXISTING_GROUP=$(getent group "$PGID" | cut -d: -f1)
if [ -z "$EXISTING_GROUP" ]; then
    GROUPNAME="$USERNAME"
    addgroup -g "$PGID" "$GROUPNAME"
else
    GROUPNAME="$EXISTING_GROUP"
fi

EXISTING_USER=$(getent passwd "$PUID" | cut -d: -f1)
if [ -z "$EXISTING_USER" ]; then
    adduser -D -u "$PUID" -G "$GROUPNAME" "$USERNAME"
    EXISTING_USER="$USERNAME"
fi

if [ -n "$STORAGE_LOCATION" ] && [ -d "$STORAGE_LOCATION" ]; then
    chown -R "${EXISTING_USER}":"${GROUPNAME}" "${STORAGE_LOCATION}" || { echo "Failed to change ownership of ${STORAGE_LOCATION} to ${PUID}:${PGID}"; exit 1; }
else
    echo "STORAGE_LOCATION is not set or does not exist"
    exit 1
fi

if [ -n "$CACHE_LOCATION" ] && [ -d "$CACHE_LOCATION" ]; then
    chown -R "${EXISTING_USER}":"${GROUPNAME}" "${CACHE_LOCATION}" || { echo "Failed to change ownership of ${CACHE_LOCATION} to ${PUID}:${PGID}"; exit 1; }
else
    echo "CACHE_LOCATION is not set or does not exist"
    exit 1
fi

# Database directory (SQLite file, and the legacy Redis dump.rdb that gets migrated on first start)
CONFIG_DIR=$(dirname "${SQLITE_PATH:-/config/iplayarr.db}")
mkdir -p "${CONFIG_DIR}"
chown -R "${EXISTING_USER}":"${GROUPNAME}" "${CONFIG_DIR}" || { echo "Failed to change ownership of ${CONFIG_DIR} to ${PUID}:${PGID}"; exit 1; }

if [ -n "$LOG_DIR" ] && [ -d "$LOG_DIR" ]; then
    chown -R "${EXISTING_USER}":"${GROUPNAME}" "${LOG_DIR}" || { echo "Failed to change ownership of ${LOG_DIR} to ${PUID}:${PGID}"; exit 1; }
else
    echo "LOG_DIR is not set or does not exist"
    exit 1
fi

find /app -name "node_modules" -prune -o \! -user "$PUID" \! -group "$PGID" -exec chown "${EXISTING_USER}":"${GROUPNAME}" {} +
exec su-exec "$EXISTING_USER" "$@"
