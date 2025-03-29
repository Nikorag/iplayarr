export interface IPlayerMetadataResponse {
    programme : IPlayerProgramMetadata
}

export interface IPlayerProgramMetadata {
    type : 'series' | 'episode' | 'brand',
    pid : string,
    parent? : IPlayerMetadataResponse,
    categories? : {
        type : string,
        key : string,
        title : string
    }[],
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
        duration : number
    }[],
    first_broadcast_date? : string,
    image? : {
        pid : string
    }
}

export interface IPlayerChilrenResponse {
    children : {
        page : number,
        total : number,
        programmes : IPlayerProgramMetadata[]
    }
}