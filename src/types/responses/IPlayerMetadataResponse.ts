export interface IPlayerMetadataResponse {
    programme : IPlayerProgramMetadata
}

export interface IPlayerProgramMetadata {
    type : 'series' | 'episode' | 'brand',
    pid : string,
    parent? : IPlayerMetadataResponse,
    categories? : {
        type : string,
        key : string
    }[],
    display_title? : {
        title : string,
        subtitle? : string
    },
    position? : number
}

export interface IPlayerChilrenResponse {
    children : {
        page : number,
        total : number,
        programmes : IPlayerProgramMetadata[]
    }
}