import { SearchResponse } from '../types/responses/SearchResponse';

// Regular Expressions
export const progressRegex: RegExp = /([\d.]+)% of ~?([\d.]+ [A-Z]+) @[ ]+([\d.]+ [A-Za-z]+\/s) ETA: ([\d:]+).*video\]$/;
export const getIplayerSeriesRegex: RegExp = /: (?:Series|Season) (\d+)/;
export const nativeSeriesRegex: RegExp = /^(?:(?:Series|Season) )?(\d+|[MDCLXVI]+)$/;
export const episodeRegex: RegExp = /^Episode (\d+)$/;

// get_iplayarr Arguments
export const listFormat: string = 'RESULT|:|<pid>|:|<name>|:|<seriesnum>|:|<episodenum>|:|<index>|:|<channel>|:|<duration>|:|<available>|:|<episode>|:|'

// Utility Strings
export const timestampFile: string = 'iplayarr_timestamp';

// Properties
export const pageSize : number = 60;
export const sizeFactor : number = 1048576; 
export const maxFacets : number = 5;

// Example Responses
export const emptySearchResult : SearchResponse = {
    pagination: {
        page: 1,
        totalPages: 1,
        totalResults: 0
    },
    results: [],
    facets: []
};
