import { formatBytes } from "../../../utils/Utils"

export enum QueueStatus {
    DOWNLOADING = "Downloading",
    IDLE = "Idle"
}

export enum QueueEntryStatus {
    DOWNLOADING = "Downloading",
    QUEUED = "Queued"
}

export interface SabNZBDQueueResponse {
    speedlimit: number,
    speedlimit_abs: number,
    paused: boolean,
    limit: number,
    start: number,
    have_warnings: number,
    pause_int: number,
    left_quota: number,
    version: string,
    cache_art: number,
    cache_size: string,
    finishaction: null,
    paused_all: boolean,
    quota: number,
    have_quota: boolean,
    diskspace1: string,
    diskspacetotal1: string,
    diskspace1_norm: string,
    status: QueueStatus,
    noofslots_total: number,
    noofslots: number,
    finish: number,
    slots: SabNZBQueueEntry[]
}

export interface SabNZBQueueEntry {
    status: QueueEntryStatus,
    index: number,
    password: string,
    avg_age: string,
    script: string,
    direct_unpack:string,
    mb: number,
    mbleft: number,
    filename: string,
    labels: string[],
    priority: string,
    cat: string,
    timeleft: string,
    percentage: number,
    nzo_id: string,
    unpackopts: number,
}

export const queueSkeleton : Partial<SabNZBDQueueResponse> = {
    "speedlimit": 9,
    "speedlimit_abs": 4718592.0,
    "paused": false,
    "limit": 10,
    "start": 0,
    "have_warnings": 0,
    "pause_int": 0,
    "left_quota": 0,
    "version": "3.x.x",
    "cache_art": 16,
    "cache_size": "6 MB",
    "finishaction": null,
    "paused_all": false,
    "quota": 0,
    "have_quota": false,
    diskspace1: formatBytes(107374182400, false),
    diskspacetotal1: formatBytes(107374182400, false),
    diskspace1_norm: formatBytes(107374182400, true),
}

export const queueEntrySkeleton : Partial<SabNZBQueueEntry> = {
    "password": "",
    "avg_age": "0d",
    "script": "None",
    "direct_unpack": "10/30",
    "labels": [],
    "priority": "Normal",
    "cat": "iplayer",
    "unpackopts": 3,
}