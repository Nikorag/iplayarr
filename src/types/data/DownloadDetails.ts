export interface DownloadDetails {
    uuid? : string,
    progress?: number,
    size?: number,
    sizeLeft?: number,
    speed?: number,
    eta?: string,
    start?: Date
}