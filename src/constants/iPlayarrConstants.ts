export const progressRegex: RegExp = /([\d.]+)% of ~?([\d.]+ [A-Z]+) @[ ]+([\d.]+ [A-Za-z]+\/s) ETA: ([\d:]+).*video\]$/;
export const getIplayerSeriesRegex: RegExp = /: (?:Series|Season) (\d+)/;
export const nativeSeriesRegex: RegExp = /^(?:(?:Series|Season) )?(\d+|[MDCLXVI]+)$/;
export const listFormat: string = 'RESULT|:|<pid>|:|<name>|:|<seriesnum>|:|<episodenum>|:|<index>|:|<channel>|:|<duration>|:|<available>';
export const timestampFile: string = 'iplayarr_timestamp';