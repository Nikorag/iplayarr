export interface LiveChannel {
    /** Used in iPlayarr's stream URLs and as the XMLTV channel id */
    id: string;
    name: string;
    /** The live "vpid" that the BBC's media selector resolves to stream URLs */
    vpid: string;
    /** iPlayer's own channel id, used to look up the schedule */
    iblId: string;
}

export const LiveChannels: LiveChannel[] = [
    { id: 'bbc-one', name: 'BBC One', vpid: 'bbc_one_hd', iblId: 'bbc_one_london' },
    { id: 'bbc-two', name: 'BBC Two', vpid: 'bbc_two_hd', iblId: 'bbc_two_england' },
    { id: 'bbc-three', name: 'BBC Three', vpid: 'bbc_three_hd', iblId: 'bbc_three' },
    { id: 'bbc-four', name: 'BBC Four', vpid: 'bbc_four_hd', iblId: 'bbc_four' },
    { id: 'bbc-news', name: 'BBC News', vpid: 'bbc_news_channel_hd', iblId: 'bbc_news24' },
    { id: 'bbc-parliament', name: 'BBC Parliament', vpid: 'bbc_parliament', iblId: 'bbc_parliament' },
    { id: 'cbbc', name: 'CBBC', vpid: 'cbbc_hd', iblId: 'cbbc' },
    { id: 'cbeebies', name: 'CBeebies', vpid: 'cbeebies_hd', iblId: 'cbeebies' },
    { id: 'bbc-scotland', name: 'BBC Scotland', vpid: 'bbc_scotland_hd', iblId: 'bbc_scotland' },
    { id: 'bbc-alba', name: 'BBC ALBA', vpid: 'bbc_alba', iblId: 'bbc_alba' },
    { id: 's4c', name: 'S4C', vpid: 's4cpbs', iblId: 's4cpbs' },
];

export const getLiveChannel = (id: string): LiveChannel | undefined => LiveChannels.find((channel) => channel.id === id);
