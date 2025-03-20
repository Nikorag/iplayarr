import {NextFunction,Request, Response, Router} from 'express';
import multer, { Multer } from 'multer';

import { EndpointDirectory, NewzNabEndpointDirectory, SabNZBDEndpointDirectory } from '../endpoints/EndpointDirectory';
import configService from '../service/configService';
import { IplayarrParameter } from '../shared/types/enums/IplayarrParameters';
import { ApiError, ApiResponse } from '../shared/types/responses/ApiResponse';

import { createRoutes } from './RouteUtils';

const router : Router = Router();
const upload : Multer = multer();

interface ApiRequest {
    apikey : string;
    mode? : string;
    t? : string;
}

router.use(upload.any());

// Middleware to check API key
router.use(async (req: Request, res: Response, next: NextFunction) => {
    const queryKey = req.query.apikey as string;
    const headerKey = req.header('X-API-Key');
    const apiKey = queryKey || headerKey;

    const envKey: string | undefined = await configService.getItem(IplayarrParameter.API_KEY);
    
    if (envKey && envKey === apiKey) {
        next();
    } else {
        res.status(401).json({ error: ApiError.NOT_AUTHORISED } as ApiResponse);
    }
});

// Handle requests after authentication
router.all('/', async (req: Request, res: Response, next: NextFunction) => {
    const { mode, t } = req.query as any as ApiRequest;
    const endpoint: string | undefined = mode || t;
    const directory: EndpointDirectory = mode ? SabNZBDEndpointDirectory : NewzNabEndpointDirectory;

    if (endpoint && directory[endpoint]) {
        directory[endpoint](req, res, next);
    } else {
        res.status(404).json({ error: ApiError.API_NOT_FOUND } as ApiResponse);
    }
});

createRoutes(router);

export default router;
