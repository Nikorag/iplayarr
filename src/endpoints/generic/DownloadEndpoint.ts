import { Request, Response } from 'express';

import iplayerService from '../../service/iplayerService';
import queueService from '../../service/queueService';
import { VideoType } from '../../types/data/IPlayerSearchResult';
import { IPlayerMetadataResponse } from '../../types/responses/IPlayerMetadataResponse';

export default async (req : Request, res : Response) => {
    const {pid} = req.query as any;

    const metadata : IPlayerMetadataResponse | undefined= await iplayerService.getMetadata(pid);
    let name : string = '';
    const type : VideoType = await getType(metadata);
    if (metadata?.programme.display_title){
        const {title, subtitle} = metadata.programme.display_title;
        name = `${title}${(type == VideoType.TV && subtitle) ? `.${subtitle}` : ''}`.replaceAll('.', '_').replaceAll(' ', '.');
    }

    queueService.addToQueue(pid, name, type)

    res.json({status : true});
}

function getType(metadata : IPlayerMetadataResponse) : VideoType {
    if (metadata.programme.categories){
        const formatCategory = metadata.programme.categories.find(({type}) => type == 'format');
        if (formatCategory && formatCategory.key == 'films'){
            return VideoType.MOVIE;
        }
    }
    return VideoType.TV;
}