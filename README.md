# <img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/public/iplayarr.png" alt="Description" width="24px"> iPlayarr

iPlayarr is a companion tool for **Sonarr** and **Radarr**, making it easy to integrate **get_iplayer** for searching and downloading iPlayer content directly. It acts as both an **indexer** and a **download client**, allowing seamless automation of TV and movie downloads.

[![Discord](https://img.shields.io/discord/1359619754456907856?label=Discord&logo=discord&style=flat)](https://discord.com/channels/1359619754456907856)
![Build Status](https://img.shields.io/github/actions/workflow/status/nikorag/iplayarr/build.yml?logo=github)
[![Coverage Status](https://coveralls.io/repos/github/Nikorag/iplayarr/badge.svg?branch=main)](https://coveralls.io/github/Nikorag/iplayarr?branch=main)

## 📸 Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/login.png" alt="Login View" width="49%">
  <img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/queue.png" alt="Queue View" width="49%">
</p>
<p align="center">
  <img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/search.png" alt="Search View" width="49%">
  <img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/details.png" alt="Details View" width="49%">
</p>

## 📰 News

### iPlayarr is now a single Nuxt application

The Express backend and the separate Vue frontend have been replaced by one [Nuxt](https://nuxt.com) application. The UI, the API (including the Newznab and SABnzbd endpoints that Sonarr and Radarr talk to) and the background tasks now run in a single process, and the frontend and API are served from the same port, `4404` by default.

What this means for you:

- **Nothing to change in Sonarr, Radarr or Prowlarr.** API URLs, API keys and the endpoints they use are unchanged.
- **You'll be logged out once.** Login sessions are handled differently, so you'll need to sign in again after upgrading.
- **Live updates use a native websocket** (`/_ws`) instead of socket.io. If you run iPlayarr behind a reverse proxy, make sure it forwards websocket connections.
- **Smaller Docker image**, as only the production build is shipped.
- **Development is simpler**: `npm install` then `npm run dev` runs everything on `http://localhost:4404`, see [Development Setup](#development-setup).

### SQLite is now the default database

iPlayarr no longer runs or needs Redis for your data. Settings, apps, synonyms, history, statistics and login sessions are stored in a **SQLite** file (`/config/iplayarr.db` in Docker), created automatically with no setup. Postgres is supported too by setting `DATABASE_URL`. Redis is now optional and only used for caching.

Upgrading from a Redis-based version is automatic, your existing data is imported on first start. See [Database](#database) and [Migrating from Redis](#migrating-from-redis) for details.

## Why iPlayarr?

iPlayer offers a wide range of high-quality content, but integrating it with Sonarr and Radarr has always been tricky. iPlayarr solves this problem by:

- Acting as a Newznab-compatible indexer, making iPlayer content searchable within Sonarr/Radarr
- Presenting as a SABnzbd-compatible download client, allowing automatic downloads and post-processing
- Handling the full download lifecycle, from fetching content with get_iplayer to organizing completed files

Unlike torrents and Usenet, iPlayarr operates in a less legally ambiguous space by only downloading content that is freely available for streaming.

## Why Create iPlayarr?

This project started as an experiment: Is it possible to integrate iPlayer with Sonarr/Radarr in a clean, automated way?

Most existing solutions rely on torrents or Usenet, but I wanted something that could get media from a reliable source. iPlayarr functions like a personal DVR for iPlayer, making it easier to automate downloads without needing traditional PVR software.

## Getting Started

### Download/Installation

The simplest way to use iPlayarr is via Docker:

```bash
docker run -d --name iplayarr \
  -v ./cache:/data \
  -v ./config:/config \
  -v ./logs:/logs \
  -v /path/to/incomplete:/incomplete \
  -v /path/to/complete:/complete \
  --env-file=env-file \
  -p 4404:4404 \
  nikorag/iplayarr:latest
```

Alternatively, use the bundled Dockerfile:

```bash
docker build -t iplayarr .
docker run -d --name iplayarr \
  -v ./cache:/data \
  -v ./config:/config \
  -v ./logs:/logs \
  -v /path/to/incomplete:/incomplete \
  -v /path/to/complete:/complete \
  --env-file=env-file \
  -p 4404:4404 \
  iplayarr
```

Or use Docker Compose:

```yml
services:
    iplayarr:
        image: 'nikorag/iplayarr:latest'
        container_name: 'iplayarr'
        environment:
            - 'API_KEY=1234'
            - 'DOWNLOAD_DIR=/mnt/media/iplayarr/incomplete'
            - 'COMPLETE_DIR=/mnt/media/iplayarr/complete'
            - 'PUID=1000'
            - 'PGID=1000'
        ports:
            - '4404:4404'
        volumes:
            - '/mnt/media:/mnt/media'
            - './cache:/data'
            - './config:/config'
            - './logs:/logs'
```

You can pre-set the following environment variables, or you can set them in the Settings menu once the container is up.

| Property     | Description                              |
| ------------ | ---------------------------------------- |
| API_KEY      | Api key to secure your iplayarr instance |
| DOWNLOAD_DIR | Download directory for in progress pulls |
| COMPLETE_DIR | Directory to move completed files to     |

There's a few more optional settings too:

| Property         | Description                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- |
| ACTIVE_LIMIT     | How many downloads are allowed simultaneously, defaults to 3                              |
| REFRESH_SCHEDULE | Cron expression for when to proactively refresh schedule, defaults to hourly, on the hour |
| HIDE_DONATE      | If you don't like the Kofi donate links you can hide them                                 |
| PUID             | Host User ID for file permissions                                                         |
| PGID             | Host Group ID for file permissions                                                        |
| DATABASE_URL     | Use Postgres instead of SQLite, see [Database](#database)                                 |
| REDIS_HOST       | Use Redis for caching instead of memory, see [Caching](#caching)                          |

> **Upgrading from a Redis-based version?** Nothing to do, see [Migrating from Redis](#migrating-from-redis).

### Usage

**Authentication**

The default details are:

| Username | Password |
| -------- | -------- |
| admin    | password |

**Sonarr and Radarr link**

> **Info:** The best way to add iPlayarr to Sonarr or Radarr is to use the "Apps" section of the web UI in iPlayarr

iPlayarr presents itself as both an indexer and a download client on port 4404. You can configure it automatically in the Settings menu or manually as follows:

**Add iPlayarr manually as a Download Client**

1. Go to Settings > Download Clients in Sonarr/Radarr.
2. Add a new SABnzbd client with the following details:

| Property | Value              |
| -------- | ------------------ |
| Name     | iPlayarr           |
| Host     | Your_Docker_Host   |
| Port     | 4404               |
| API Key  | API_KEY from above |
| Category | iplayer            |

3. Test and save.

**Add iPlayarr manually as an Indexer**

1. Go to Settings > Indexers in Sonarr/Radarr.
2. Add a new Newznab indexer with these settings:

| Property        | Value                        |
| --------------- | ---------------------------- |
| Name            | iPlayarr                     |
| URL             | http://Your_Docker_Host:4404 |
| API Key         | API_KEY from above           |
| Download Client | iPlayarr (created above)     |

### Web Interface

To access the web frontend, visit `http://Your_Docker_Host:4404`.
From here, you can manage settings, view logs, and monitor downloads.

## Development Setup

To run iPlayarr locally for development:

### Prerequisites

- Node.js (see `.node-version` for current version)
- Docker (optional, only needed for a local Postgres or Redis instance)

### Installation

1. Install dependencies:

```bash
npm install
```

2. By default the dev server uses a local SQLite file at `./config/iplayarr.db`, so there's nothing else to run. To develop against Postgres, see the [Database](#database) section (`npm run serve:postgres` starts a local one).

3. Start the development server:

```bash
npm run dev
```

iPlayarr is a single [Nuxt](https://nuxt.com) application: the Vue frontend lives in `app/` and the API (Nitro server routes, websocket and background tasks) in `server/`. Everything is served from `http://localhost:4404`.

### Additional Useful Scripts

| Script             | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `npm run build`    | Build for production (output goes to `.output`)           |
| `npm start`        | Run the production build (port 4404 unless `PORT` is set) |
| `npm test`         | Run tests with coverage                                   |
| `npm run lint`     | Run ESLint                                                |
| `npm run prettier` | Check code formatting                                     |

## Database

iPlayarr stores its settings, apps, synonyms, history, statistics and login sessions in a database. By default this is a **SQLite** file that is created automatically and **doesn't require any additional setup**. In Docker it lives in the `/config` volume (`/config/iplayarr.db`), so make sure that's mounted.

To use **Postgres** instead, set `DATABASE_URL`. The schema is created and upgraded automatically on startup.

| Property     | Description                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| DATABASE_URL | Postgres connection string, e.g. `postgres://user:password@host:5432/iplayarr`. If unset, SQLite is used |
| DATABASE_SSL | Set to `true` to connect to Postgres over TLS                                                            |
| SQLITE_PATH  | Location of the SQLite file (default `/config/iplayarr.db` in Docker, `./config/iplayarr.db` otherwise)  |

```yml
services:
    iplayarr:
        image: 'nikorag/iplayarr:latest'
        environment:
            - 'DATABASE_URL=postgres://iplayarr:secret@postgres:5432/iplayarr'
        depends_on:
            - postgres
    postgres:
        image: postgres:16-alpine
        environment:
            - 'POSTGRES_USER=iplayarr'
            - 'POSTGRES_PASSWORD=secret'
            - 'POSTGRES_DB=iplayarr'
        volumes:
            - './postgres:/var/lib/postgresql/data'
```

Back up SQLite by copying the `iplayarr.db` file (plus `-wal`/`-shm` files if present, ideally with the container stopped), or Postgres with `pg_dump`.

## Caching

Search results, schedule and metadata lookups are cached **in memory** by default. This cache is cleared when iPlayarr restarts, and rebuilds itself as needed.

If you would prefer a persistent or shared cache, you can optionally point iPlayarr at a Redis instance by setting the following. Redis is **only** used for caching, never for your data.

- REDIS_HOST
- REDIS_PORT (optional, default 6379)
- REDIS_PASSWORD (optional)
- REDIS_SSL (optionally 'true')

If `REDIS_HOST` isn't set, the in-memory cache is used.

## Migrating from Redis

Earlier versions of iPlayarr kept all their data in Redis (either the copy bundled in the container, or an external one via `REDIS_HOST`). Upgrading is automatic: on first start, iPlayarr imports your existing data and then carries on as normal.

What is migrated: settings, apps, synonyms, history, cached off-schedule series, search/grab statistics. Logged-in sessions aren't carried over, so you'll need to log in again. Search/schedule/metadata caches and the live log buffer aren't migrated, they simply rebuild.

- **Bundled Redis (the default):** keep your `/config` volume mounted as before. iPlayarr reads the old `dump.rdb` from it, using a temporary, throwaway Redis process on a _copy_ of the file. Your `dump.rdb` is never modified and is left in place as a backup, once you're happy you can delete it.
- **External Redis (`REDIS_HOST` set):** leave the `REDIS_*` variables as they are. Your data is imported once from that instance, which is then (if you keep `REDIS_HOST`) used purely as the cache. If you don't want a Redis cache, remove the variables after the first successful start.

The migration only runs once (it's recorded in the database) and never overwrites anything that already exists in the new database. If it can't read your old data, iPlayarr stops with an error rather than starting empty, and nothing is changed. Fix the problem and restart, or set `SKIP_REDIS_MIGRATION=true` to deliberately start from scratch.

| Property             | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| SKIP_REDIS_MIGRATION | Set to `true` to skip importing old Redis data                   |
| REDIS_DATA_DIR       | Where to look for the old bundled `dump.rdb` (default `/config`) |
