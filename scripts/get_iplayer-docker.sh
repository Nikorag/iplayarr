#!/bin/sh
# Runs get_iplayer inside a Docker container. Point GET_IPLAYER_EXEC at this script:
#   docker build -f docker/get_iplayer.Dockerfile -t iplayarr-get-iplayer .
#   GET_IPLAYER_EXEC=$PWD/scripts/get_iplayer-docker.sh npm run dev
# The --output directory is bind-mounted at the same path, so files land where iPlayarr expects.
# Set IPLAYER_PROFILE_DIR to persist get_iplayer's cache/profile between runs.
IMAGE="${IPLAYER_DOCKER_IMAGE:-iplayarr-get-iplayer}"
PROFILE_DIR="${IPLAYER_PROFILE_DIR:-$HOME/.get_iplayer-docker}"
mkdir -p "$PROFILE_DIR"

MOUNTS=""
prev=""
for arg in "$@"; do
    if [ "$prev" = "--output" ]; then
        mkdir -p "$arg"
        MOUNTS="$MOUNTS -v $arg:$arg"
    fi
    prev="$arg"
done

# shellcheck disable=SC2086
exec docker run --rm -i -v "$PROFILE_DIR:/root/.get_iplayer" $MOUNTS "$IMAGE" "$@"
