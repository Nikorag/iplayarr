# Redis is no longer run by iPlayarr. The binary is only kept so existing installs can
# import their old bundled-Redis data (dump.rdb) into the new database on first start.
FROM redis:alpine AS redis

# Main build stage
FROM node:current-alpine3.20

RUN apk --update add \
    ffmpeg \
    openssl \
    perl-mojolicious \
    perl-lwp-protocol-https \
    perl-xml-simple \
    perl-xml-libxml \
    su-exec \
    make \
    build-base \
    atomicparsley --repository http://dl-3.alpinelinux.org/alpine/edge/testing/ --allow-untrusted

# Symlink AtomicParsley
RUN ln -s `which atomicparsley` /usr/local/bin/AtomicParsley

RUN mkdir -p /data/output /data/config /config /data /node-persist /app/frontend /logs

WORKDIR /iplayer

ENV GET_IPLAYER_VERSION=3.35

RUN wget -qO- https://github.com/get-iplayer/get_iplayer/archive/v${GET_IPLAYER_VERSION}.tar.gz | tar -xvz -C /tmp && \
    mv /tmp/get_iplayer-${GET_IPLAYER_VERSION}/get_iplayer . && \
    rm -rf /tmp/* && \
    chmod +x ./get_iplayer

ENV GET_IPLAYER_EXEC=/iplayer/get_iplayer
ENV STORAGE_LOCATION=/node-persist
ENV CACHE_LOCATION=/data
# SQLite database lives in the /config volume (same place the old bundled Redis kept its dump.rdb).
# Set DATABASE_URL to a postgres:// connection string to use Postgres instead.
ENV SQLITE_PATH=/config/iplayarr.db
ENV REDIS_DATA_DIR=/config
ENV REDIS_SERVER_BIN=/redis/redis-server

WORKDIR /ytdlp

RUN apk add --no-cache python3 py3-pip
RUN wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
RUN chmod +x ./yt-dlp

ENV YTDLP_EXEC=/ytdlp/yt-dlp

# Copy Redis binary (used only by the one-off legacy data migration)
WORKDIR /redis
COPY --from=redis /usr/local/bin/redis-server /redis/redis-server
RUN chmod +x /redis/redis-server

# Install iplayarr
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/

RUN npm run install:both
COPY . .
RUN npm run build:both
RUN rm -rf /app/src /app/frontend/src

ENV LOG_DIR=/logs

ENTRYPOINT [ "./docker_entry.sh" ]
CMD ["npm", "run", "start"]
