import { Request, Response } from 'express';
import configService from 'src/service/configService';
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters';
import { configSkeleton, SabNZBDConfigResponse } from 'src/types/responses/sabnzbd/ConfigResponse';

export default async (_ : Request, res : Response) => {
    const [download_dir, complete_dir] = await configService.getParameters(IplayarrParameter.DOWNLOAD_DIR, IplayarrParameter.COMPLETE_DIR);

    const configObject : SabNZBDConfigResponse = {
        ...configSkeleton,
        misc : {
            download_dir,
            complete_dir
        }
    } as SabNZBDConfigResponse;
    res.json({config : configObject});
};