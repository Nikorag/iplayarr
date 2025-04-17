export interface LogLine {
    id : string,
    message: string,
    timestamp : Date,
    level : LogLineLevel
}

export enum LogLineLevel {
    INFO = 'INFO',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG'
}