import { Request, Response } from 'express';

import episodeCacheService from '../../service/episodeCacheService';
import queueService from '../../service/queueService';
import { IPlayerDataLayerResponse } from '../../types/responses/iplayer/EpisodeCacheTypes';
import { VideoType } from '../../types/responses/iplayer/IPlayerSearchResult';

export default async (req : Request, res : Response) => {
    const {pid} = req.query as any;

    const dataLayer : IPlayerDataLayerResponse | undefined= await episodeCacheService.getDetailScript(`https://www.bbc.co.uk/iplayer/episode/${pid}`);
    let name : string = '';
    const type : VideoType = dataLayer?.header?.genre?.startsWith('Film') ? VideoType.MOVIE : VideoType.TV;
    if (dataLayer?.header){
        const {title, subtitle} = dataLayer.header;
        name = `${title}${(type == VideoType.TV && subtitle) ? `.${subtitle}` : ''}`.replaceAll('.', '_').replaceAll(' ', '.');
    } else if (dataLayer?.episode){
        const {title, subtitle} = dataLayer.episode;
        name = `${title}${(type == VideoType.TV && subtitle) ? `.${subtitle}` : ''}`.replaceAll('.', '_').replaceAll(' ', '.');
    }

    queueService.addToQueue(pid, name, type)

    res.json({status : true});
}