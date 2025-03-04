import { NextFunction, Request, Response } from "express";
import { getParameter } from "../../service/configService";
import { IplayarrParameter } from "../../types/IplayarrParameters";
import { configSkeleton, SabNZBDConfigResponse } from "../../types/responses/sabnzbd/ConfigResponse";

export default async (req : Request, res : Response, next : NextFunction) => {
    const download_dir = await getParameter(IplayarrParameter.DOWNLOAD_DIR) as string;
    const complete_dir = await getParameter(IplayarrParameter.COMPLETE_DIR) as string;

    const configObject : SabNZBDConfigResponse = {
        ...configSkeleton,
        misc : {
            download_dir,
            complete_dir
        }
    } as SabNZBDConfigResponse;
    res.json({config : configObject});
};