# Use Redis Alpine as a source for the binary
FROM redis:alpine AS redis

# Main build stage
FROM node:current-alpine

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

RUN mkdir -p /data/output /data/config /config /data /node-persist /app/frontend

WORKDIR /iplayer

ENV GET_IPLAYER_VERSION=3.35

RUN wget -qO- https://github.com/get-iplayer/get_iplayer/archive/v${GET_IPLAYER_VERSION}.tar.gz | tar -xvz -C /tmp && \
    mv /tmp/get_iplayer-${GET_IPLAYER_VERSION}/get_iplayer . && \
    rm -rf /tmp/* && \
    chmod +x ./get_iplayer

ENV GET_IPLAYER_EXEC=/iplayer/get_iplayer
ENV STORAGE_LOCATION=/node-persist
ENV CACHE_LOCATION=/data

# Copy Redis binary from the Redis Alpine image
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

ENTRYPOINT [ "./docker_entry.sh" ]
CMD ["npm", "run", "start"]
