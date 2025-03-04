export interface SabNZBDConfigResponse {
    misc : SabNZBDConfigMiscResponse,
    categories : SabNZBDConfigCategoryResponse[],
    servers : string[]
}

export interface SabNZBDConfigCategoryResponse {
    name : string,
    order : number,
    pp : string,
    script : string,
    dir : string,
    newzbin : string,
    priority : number
}

export interface SabNZBDConfigMiscResponse {
    download_dir : string,
    complete_dir : string
}

export const configSkeleton : Partial<SabNZBDConfigResponse> = {
    "categories": [
        {
            "name": "*",
            "order": 0,
            "pp": "3",
            "script": "None",
            "dir": "",
            "newzbin": "",
            "priority": 0
        },
        {
            "name": "iplayer",
            "order": 1,
            "pp": "",
            "script": "Default",
            "dir": "",
            "newzbin": "",
            "priority": -100
        }
    ],
    "servers": [],
}