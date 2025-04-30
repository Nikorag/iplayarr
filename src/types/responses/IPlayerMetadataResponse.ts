export interface IPlayerMetadataResponse {
    programme: IPlayerProgramMetadata;
}

export interface IPlayerProgramMetadata {
    type: 'series' | 'episode' | 'brand';
    pid: string;
    parent?: IPlayerMetadataResponse;
    categories?: IPlayerCategoryResponse[];
    display_title?: {
        title: string;
        subtitle?: string;
    };
    position?: number | null;
    title: string;
    ownership?: {
        service?: {
            title?: string;
        };
    };
    medium_synopsis?: string;
    versions?: {
        canonical: number;
        pid: string;
        duration: number;
        types: string[];
    }[];
    first_broadcast_date?: string | null;
    image?: {
        pid: string;
    };
    expected_child_count?: number | null;
    aggregated_episode_count?: number | null;
}

export interface IPlayerCategoryResponse {
    type: string;
    id: string;
    key: string;
    title: string;
    narrower?: IPlayerCategoryResponse[] | never[];
    broader: {
        category?: IPlayerCategoryResponse;
    };
    has_topic_page: boolean;
    sameAs?: IPlayerCategoryResponse | null;
}

export interface IPlayerChildrenResponse {
    children: {
        page: number;
        total: number;
        programmes: IPlayerProgramMetadata[];
    };
}

export interface IPlayerEpisodesResponse {
    programme_episodes: {
        elements: IPlayerEpisodeMetadata[];
    }
}

export interface IPlayerEpisodeMetadata {
    id: string;
    type: 'episode' | 'brand' | 'series';
    release_date_time?: string
    title: string
}