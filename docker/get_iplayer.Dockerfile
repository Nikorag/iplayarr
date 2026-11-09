# get_iplayer plus its runtime dependencies, for running downloads in a container
# instead of installing get_iplayer on the host. See scripts/get_iplayer-docker.sh
FROM alpine:3.20

RUN apk --update add \
    ffmpeg \
    openssl \
    perl \
    perl-mojolicious \
    perl-lwp-protocol-https \
    perl-xml-simple \
    perl-xml-libxml \
    wget \
    atomicparsley --repository http://dl-3.alpinelinux.org/alpine/edge/testing/ --allow-untrusted

RUN ln -s "$(which atomicparsley)" /usr/local/bin/AtomicParsley

ENV GET_IPLAYER_VERSION=3.35
RUN wget -qO- https://github.com/get-iplayer/get_iplayer/archive/v${GET_IPLAYER_VERSION}.tar.gz | tar -xvz -C /tmp && \
    mv /tmp/get_iplayer-${GET_IPLAYER_VERSION}/get_iplayer /usr/local/bin/get_iplayer && \
    rm -rf /tmp/* && \
    chmod +x /usr/local/bin/get_iplayer

ENTRYPOINT ["get_iplayer"]
