import { Request, Response } from 'express';
import episodeCacheService from 'src/service/episodeCacheService';
import queueService from 'src/service/queueService';
import { VideoType } from 'src/types/data/IPlayerSearchResult';
import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';

interface DownloadQueryString {
    pid : string
}

export default async (req : Request, res : Response) => {
    const {pid} : DownloadQueryString = req.query as any;

    const metadata : IPlayerMetadataResponse | undefined= await episodeCacheService.getMetadata(pid);
    const type : VideoType = getType(metadata);
    const name : string = getName(metadata, type);

    queueService.addToQueue(pid, name, type);

    res.json({status : true});
}

function getType(metadata? : IPlayerMetadataResponse) : VideoType {
    if (metadata?.programme.categories){
        const formatCategory = metadata?.programme.categories.find(({type}) => type == 'format');
        if (formatCategory && formatCategory.key == 'films'){
            return VideoType.MOVIE;
        }
    }
    return VideoType.TV;
}

function getName(metadata : IPlayerMetadataResponse | undefined, type : VideoType) : string {
    if (metadata?.programme.display_title){
        const {title, subtitle} = metadata.programme.display_title;
        return `${title}${(type == VideoType.TV && subtitle) ? `.${subtitle}` : ''}`.replaceAll('.', '_').replaceAll(' ', '.');
    }
    return '';
}