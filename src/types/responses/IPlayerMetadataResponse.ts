export interface IPlayerMetadataResponse {
    programme : IPlayerProgramMetadata
}

export interface IPlayerProgramMetadata {
    type : 'series' | 'episode' | 'brand',
    pid : string,
    parent? : IPlayerMetadataResponse,
    categories? : IPlayerCategoryResponse[],
    display_title? : {
        title : string,
        subtitle? : string
    },
    position? : number
    title : string,
    ownership? : {
        service? : {
            title? : string
        }
    },
    medium_synopsis? : string,
    versions? : {
        canonical: number,
        pid: string,
        duration : number,
        types: string[]
    }[],
    first_broadcast_date? : string,
    image? : {
        pid : string
    },
    aggregated_episode_count? : number
}

export interface IPlayerCategoryResponse {
    type : string
    id : string
    key : string
    title : string,
    narrower? : IPlayerCategoryResponse[],
    broader : {
        category? : IPlayerCategoryResponse
    },
    has_topic_page : boolean,
    sameAs? : IPlayerCategoryResponse
}


export interface IPlayerChildrenResponse {
    children : {
        page : number,
        total : number,
        programmes : IPlayerProgramMetadata[]
    }
}