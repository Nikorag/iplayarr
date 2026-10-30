export interface Synonym {
    id: string;
    from: string;
    target: string;
    filenameOverride?: string;
    exemptions: string;
    seasonOffset?: number; // Season offset to translate between Sonarr/iPlayer
}
