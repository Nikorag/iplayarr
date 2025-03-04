import {Router, Request, Response, NextFunction} from 'express';
import { getParameter } from '../service/configService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';
import { EndpointDirectory, NewzNabEndpointDirectory, SabNZBDEndpointDirectory } from '../endpoints/EndpointDirectory';
import multer, { Multer } from 'multer';

const router : Router = Router();
const upload : Multer = multer();

interface ApiRequest {
    apikey : string;
    mode? : string;
    t? : string;
}

router.all('/', upload.any(), async (req : Request, res : Response, next : NextFunction) => {
    const {apikey : queryKey, mode, t} = req.query as any as ApiRequest;
    const envKey : string | undefined = await getParameter(IplayarrParameter.API_KEY);
    if (envKey && envKey == queryKey){
        const endpoint : string | undefined = mode || t;
        const directory : EndpointDirectory = mode ? SabNZBDEndpointDirectory : NewzNabEndpointDirectory;
        if (endpoint && directory[endpoint]){
            directory[endpoint](req, res, next);
        } else {
            res.status(404).json({ "error": ApiError.API_NOT_FOUND } as ApiResponse);
        }
    } else {
        res.status(401).json({ "error": ApiError.NOT_AUTHORISED } as ApiResponse);
    }
});

export default router;