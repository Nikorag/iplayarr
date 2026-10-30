export interface ChannelDefinition {
    id : string,
    name : string
}

export const ChannelSchedule : ChannelDefinition[] = [
        { id: 'p00fzl6b', name: 'BBC Four' }, // bbcfour/programmes/schedules
        { id: 'p00fzl6g', name: 'BBC News' }, // bbcnews/programmes/schedules
        { id: 'p00fzl6n', name: 'BBC One' }, // bbcone/programmes/schedules/hd
        { id: 'p00fzl73', name: 'BBC Parliament' }, // bbcparliament/programmes/schedules
        { id: 'p00fzl95', name: 'BBC Three' }, // bbcthree/programmes/schedules
        { id: 'p015pksy', name: 'BBC Two' }, // bbctwo/programmes/schedules/hd
        { id: 'p00fzl9r', name: 'CBBC' }, // cbbc/programmes/schedules
        { id: 'p00fzl9s', name: 'CBeebies' }, // cbeebies/programmes/schedules
        { id: 'p00fzl67', name: 'BBC Alba' }, // bbcalba/programmes/schedules
        { id: 'p00fzl6q', name: 'BBC One Northern Ireland' }, // bbcone/programmes/schedules/ni
        { id: 'p00zskxc', name: 'BBC One Northern Ireland' }, // bbcone/programmes/schedules/ni_hd
        { id: 'p00fzl6v', name: 'BBC One Scotland' }, // bbcone/programmes/schedules/scotland
        { id: 'p013blmc', name: 'BBC One Scotland' }, // bbcone/programmes/schedules/scotland_hd
        { id: 'p00fzl6z', name: 'BBC One Wales' }, // bbcone/programmes/schedules/wales
        { id: 'p013bkc7', name: 'BBC One Wales' }, // bbcone/programmes/schedules/wales_hd
        { id: 'p06kvypx', name: 'BBC Scotland' }, // bbcscotland/programmes/schedules
        { id: 'p06p396y', name: 'BBC Scotland' }, // bbcscotland/programmes/schedules/hd
        { id: 'p00fzl97', name: 'BBC Two England' }, // bbctwo/programmes/schedules/england
        { id: 'p00fzl99', name: 'BBC Two Northern Ireland' }, // bbctwo/programmes/schedules/ni
        { id: 'p06ngcbm', name: 'BBC Two Northern Ireland' }, // bbctwo/programmes/schedules/ni_hd
        { id: 'p00fzl9d', name: 'BBC Two Wales' }, // bbctwo/programmes/schedules/wales
        { id: 'p06ngc52', name: 'BBC Two Wales' }, // bbctwo/programmes/schedules/wales_hd
        { id: 'p020dmkf', name: 'S4C' }, // s4c/programmes/schedules
        { id: 'p00fzl6h', name: 'BBC One Cambridgeshire' }, // bbcone/programmes/schedules/cambridge
        { id: 'p00fzl6j', name: 'BBC One Channel Islands' }, // bbcone/programmes/schedules/channel_islands
        { id: 'p00fzl6k', name: 'BBC One East' }, // bbcone/programmes/schedules/east
        { id: 'p00fzl6l', name: 'BBC One East Midlands' }, // bbcone/programmes/schedules/east_midlands
        { id: 'p00fzl6m', name: 'BBC One Yorks & Lincs' }, // bbcone/programmes/schedules/east_yorkshire
        { id: 'p00fzl6p', name: 'BBC One London' }, // bbcone/programmes/schedules/london
        { id: 'p00fzl6r', name: 'BBC One North East & Cumbria' }, // bbcone/programmes/schedules/north_east
        { id: 'p00fzl6s', name: 'BBC One North West' }, // bbcone/programmes/schedules/north_west
        { id: 'p00fzl6t', name: 'BBC One Oxfordshire' }, // bbcone/programmes/schedules/oxford
        { id: 'p00fzl6w', name: 'BBC One South' }, // bbcone/programmes/schedules/south
        { id: 'p00fzl6x', name: 'BBC One South East' }, // bbcone/programmes/schedules/south_east
        { id: 'p00fzl6y', name: 'BBC One South West' }, // bbcone/programmes/schedules/south_west
        { id: 'p00fzl70', name: 'BBC One West' }, // bbcone/programmes/schedules/west
        { id: 'p00fzl71', name: 'BBC One West Midlands' }, // bbcone/programmes/schedules/west_midlands
        { id: 'p00fzl72', name: 'BBC One Yorkshire' }, // bbcone/programmes/schedules/yorkshire
];

// https://www.bbc.co.uk/schedules/p00fzl67/2025/04/27 - Then use JSDOM