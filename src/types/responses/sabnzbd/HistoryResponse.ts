export enum HistoryStatus {
    COMPLETED = 'Completed'
}

export const historySkeleton : Partial<SabNZBDHistoryResponse> = {
    'noofslots': 220,
    'ppslots': 1,
    'day_size': '1.9 G',
    'week_size': '30.4 G',
    'month_size': '167.3 G',
    'total_size': '678.1 G',
    'last_history_update': 1469210913,
}

export const historyEntrySkeleton : Partial<SABNZBDHistoryEntryResponse> = {
    'action_line': '',
    'meta': null,
    'fail_message': '',
    'loaded': false,
    'category': 'iplayer',
    'pp': 'D',
    'retry': 0,
    'script': 'None',
    'download_time': 64,
    'has_rating': false,
    'status': HistoryStatus.COMPLETED,
    'script_line': '',
    'report': '',
    'password': '',
    'postproc_time': 40,
    'md5sum': 'd2c16aeecbc1b1921d04422850e93013',
    'archive': false,
    'url_info': '',
    'stage_log': []
}

export interface SabNZBDHistoryResponse {
    noofslots: number,
    ppslots: number,
    day_size: string,
    week_size: string,
    month_size: string,
    total_size: string,
    last_history_update: number,
    slots: SABNZBDHistoryEntryResponse[]
}

export interface SABNZBDHistoryEntryResponse {
    action_line: string,
    duplicate_key: string,
    meta: null,
    fail_message: string,
    loaded: boolean,
    size: string,
    category: string,
    pp: string,
    retry: number,
    script: string,
    nzb_name: string,
    download_time: number,
    storage: string,
    has_rating: boolean,
    status: HistoryStatus,
    script_line: string,
    completed: number,
    nzo_id: string,
    downloaded: number,
    report: string,
    password: string,
    path: string,
    postproc_time: number,
    name: string,
    url: string,
    md5sum: string,
    archive: boolean,
    bytes: number,
    url_info: string,
    stage_log: string[]
}