export const progressRegex: RegExp =
    /([\d.]+)% of ~\s*(?:([\d.]+\s?[A-Za-z]+)|N\/A) @\s*([\d.]+\s?[A-Za-z]+\/s) ETA: (?:([\d:]+)|NA).*video\]$/;
export const getIplayerSeriesRegex: RegExp = /: (?:Series|Season) (\d+)/;
export const nativeSeriesRegex: RegExp = /^(?:(?:Series|Season) )?(\d+|[MDCLXVI]+)$/;
export const episodeRegex: RegExp = /^Episode (\d+)$/;
export const listFormat: string =
    'RESULT|:|<pid>|:|<name>|:|<seriesnum>|:|<episodenum>|:|<index>|:|<channel>|:|<duration>|:|<available>|:|<episode>|:|';
export const timestampFile: string = 'iplayarr_timestamp';
