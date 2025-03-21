export interface NZBFileResponse {
    $: { xmlns: string },
    head: {
        title: string,
        meta: NZBMetaEntry[]
    },
    file: {
        $: {
            poster: string,
            date: number,
            subject: string
        },
        groups: {
            group: string[]
        },
        segments: {
            segment: NZBSegmentEntry[]
        }
    }
}

export interface NZBMetaEntry {
    $ : { type : string, _ : string}
}

interface NZBSegmentEntry {
    _ : string,
    $: {
        bytes : number,
        number: number
    }
}