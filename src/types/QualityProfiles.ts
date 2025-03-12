export interface QualityProfile {
    id : string,
    name : string,
    quality : string,
    sizeFactor : number
}

export const qualityProfiles : QualityProfile[] = [
    {id : 'mobile', name : 'Mobile', quality : '288p', sizeFactor : 0.012},
    {id : 'web', name : 'Web', quality : '396p', sizeFactor : 0.22},
    {id : 'sd', name : 'SD', quality : '540p', sizeFactor : 0.33},
    {id : 'hd', name : 'HD', quality : '720p', sizeFactor : 0.61},
    {id : 'fhd', name : 'Full-HD', quality : '1080p', sizeFactor : 1},
];