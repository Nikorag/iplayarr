
# <img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/frontend/public/iplayarr.png" alt="Description" width="45" style="margin-right: 1rem;"> iPlayarr

iPlayarr is a companion tool for **Sonarr** and **Radarr**, making it easy to integrate **get_iplayer** for searching and downloading iPlayer content directly. It acts as both an **indexer** and a **download client**, allowing seamless automation of TV and movie downloads. 

## 📸 Screenshots

<img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/login.png" alt="Login View" width="200" style="margin-right: 1rem; display: inline-block;">

<img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/queue.png" alt="Queue View" width="200" style="margin-right: 1rem; display: inline-block;">

<img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/search.png" alt="Search View" width="200" style="margin-right: 1rem; display: inline-block;">

<img src="https://raw.githubusercontent.com/Nikorag/iplayarr/refs/heads/main/readme-media/details.png" alt="Details View" width="200" style="margin-right: 1rem; display: inline-block;">

## Why iPlayarr?

iPlayer offers a wide range of high-quality content, but integrating it with Sonarr and Radarr has always been tricky. iPlayarr solves this problem by:

✔️ Acting as a Newznab-compatible indexer, making iPlayer content searchable within Sonarr/Radarr.

✔️ Presenting as a SABnzbd-compatible download client, allowing automatic downloads and post-processing.

✔️ Handling the full download lifecycle, from fetching content with get_iplayer to organizing completed files.

Unlike torrents and Usenet, iPlayarr operates in a less legally ambiguous space by only downloading content that is freely available for streaming.

## Why Create iPlayarr?

This project started as an experiment: Could I integrate iPlayer with Sonarr/Radarr in a clean, automated way?

Most existing solutions rely on torrents or Usenet, but I wanted something that could get media from a reliable source. iPlayarr functions like a personal DVR for iPlayer, making it easier to automate downloads without needing traditional PVR software.

## Getting Started

### Download/Installation

The simplest way to use iPlayarr is via Docker:

```
docker run -d --name iplayarr \
  -v ./cache:/data \
  -v ./config:/config \
  -v /path/to/incomplete:/incomplete \
  -v /path/to/complete:/complete \
  --env-file=env-file \
  -p 4404:4404 \
  nikorag/iplayarr:latest
```

Alternatively, use the bundled Dockerfile:

```
docker build -t iplayarr .
docker run -d --name iplayarr \
  -v ./cache:/data \
  -v ./config:/config \
  -v /path/to/incomplete:/incomplete \
  -v /path/to/complete:/complete \
  --env-file=env-file \
  -p 4404:4404 \
  iplayarr
```

or use Docker Compose

```
services:
  iplayarr:
    image: "nikorag/iplayarr:latest"
    container_name: "iplayarr"
    environment:
      - "API_KEY=1234"
      - "DOWNLOAD_DIR=/mnt/media/iplayarr/incomplete"
      - "COMPLETE_DIR=/mnt/media/iplayarr/complete"
    ports:
      - "4404:4404"
    volumes:
      - "/mnt/media:/mnt/media"
      - "./cache:/data"
      - "./config:/config"
```

You can pre-set the following environment variables, or you can set them in the Settings menu once the container is up.

| Property     | Description                                  |
| ------------ | -------------------------------------------- |
| API_KEY      | Api key to secure your iplayarr instance     |
| DOWNLOAD_DIR | Download directory for in progress pulls     |
| COMPLETE_DIR | Directory to move completed files to         |

There's a few more optional settings too:

| Property | Description |
| -------- | ----------- |
| ACTIVE_LIMIT | How many downloads are allowed simultaneously, defaults to 3 |
| REFRESH_SCHEDULE | Cron expression for when to pro-actively refresh schedule, defaults to hourly, on the hour |
| HIDE_DONATE | If you don't like the Kofi donate links you can hide them |

### Usage

**Authentication**

The default details are:

| Username | Password |
| -------- | ----- |
| admin | password |

**Sonarr and Radarr link**

iPlayarr presents itself as both an indexer and a download client on port 4404. You can configure it automatically in the Settings menu or manually as follows:

**Add iPlayarr as a Download Client**

1. Go to Settings > Download Clients in Sonarr/Radarr.
2. Add a new SABnzbd client with the following details:

| Property | Value |
| ---------| ----- |
| Name     | iPlayarr |
| Host     | Your_Docker_Host |
| Port     | 4404 |
| API Key  | API_KEY from above |
| Category | iplayer |

3. Test and save.

**Add iPlayarr as an Indexer**

1. Go to Settings > Indexers in Sonarr/Radarr.
2. Add a new Newznab indexer with these settings:

| Property | Value |
| ---------| ----- |
| Name     | iPlayarr |
| URL      | http://Your_Docker_Host:4404 |
| API Key  | API_KEY from above |
| Download Client  | iPlayarr (created above) |

### Web Interface

To access the web frontend, visit:

```
http://Your_Docker_Host:4404
```

From here, you can manage settings, view logs, and monitor downloads.
