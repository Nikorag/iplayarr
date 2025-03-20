import { Request, Response } from 'express';

import configService from '../../service/configService';
import { IplayarrParameter } from '../../shared/types/enums/IplayarrParameters';
import { configSkeleton, SabNZBDConfigResponse } from '../../shared/types/responses/sabnzbd/ConfigResponse';

export default async (req : Request, res : Response) => {
    const download_dir = await configService.getItem(IplayarrParameter.DOWNLOAD_DIR) as string;
    const complete_dir = await configService.getItem(IplayarrParameter.COMPLETE_DIR) as string;

    const configObject : SabNZBDConfigResponse = {
        ...configSkeleton,
        misc : {
            download_dir,
            complete_dir
        }
    } as SabNZBDConfigResponse;
    res.json({config : configObject});
};