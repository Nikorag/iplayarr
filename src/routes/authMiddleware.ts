import {Express, NextFunction,Request, Response, Router} from 'express';
import session from 'express-session'
import { v4 } from 'uuid';

import configService from '../service/configService';
import User from '../types/data/User'
import { IplayarrParameter } from '../types/enums/IplayarrParameters';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';
import { md5 } from '../utils/Utils';

declare module 'express-session' {
    interface SessionData {
        user: User;
    }
}

const isDebug = process.env.DEBUG == 'true';
const router : Router = Router();

let token : string = '';
let resetTimer : NodeJS.Timeout | undefined;

export const addAuthMiddleware = (app : Express) => {
    const sessionCookieSettings : any = {secure : false, maxAge: 1000 * 60 * 60 * 24}
    if (isDebug){
        sessionCookieSettings.sameSite = 'lax';
    }

    app.use(session({
        secret: process.env.SESSION_SECRET || 'default_secret_key', // Replace in production
        resave: false,
        saveUninitialized: false,
        cookie: sessionCookieSettings
    }));

    app.use('/json-api/*', async (req: Request, res: Response, next: NextFunction) => {    
        const api_key = await configService.getItem(IplayarrParameter.API_KEY);
        if (req.headers['x-api-key'] != api_key && !req.session?.user) {
            res.status(401).json({ error: ApiError.NOT_AUTHORISED } as ApiResponse);
            return;
        }
        next();
    });    
}

export async function expressAuthentication(req: Request, securityName: string) : Promise<any> {
    if (securityName === 'api_key') {
        const api_key = await configService.getItem(IplayarrParameter.API_KEY);
        if (req.headers['x-api-key'] != api_key && !req.session?.user) {
            return Promise.reject({ error: ApiError.NOT_AUTHORISED } as ApiResponse)
        }
        return Promise.resolve();
    }
}

router.post('/login', async (req: Request, res: Response) => {
    const [AUTH_USERNAME, AUTH_PASSWORD] = await Promise.all([
        configService.getItem(IplayarrParameter.AUTH_USERNAME),
        configService.getItem(IplayarrParameter.AUTH_PASSWORD),
    ])
    const { username, password } = req.body;

    // Replace this with actual authentication logic
    if (username === AUTH_USERNAME && md5(password) === AUTH_PASSWORD) {
        req.session.user = { username };
        res.json({status : true});
        return;
    }

    res.status(401).json({ error : ApiError.INVALID_CREDENTIALS} as ApiResponse);

});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({status : true});
    });
});

router.get('/me', (req : Request, res : Response) => {
    if (!req.session?.user){
        res.status(401).json({ error : ApiError.NOT_AUTHORISED} as ApiResponse);
        return;
    } else {
        res.json(req.session.user);
        return;
    }
});

router.post('/generateToken', (_ : Request, res : Response) => {
    token = v4();
    console.log(`FORGOT PASSWORD TOKEN: ${token} This expires in 5 minutes`);
    if (resetTimer){
        clearTimeout(resetTimer);
    }
    resetTimer = setTimeout(() => token='', 300000);
    res.json({status : true});
});

router.post('/resetPassword', async (req : Request, res : Response) => {
    const {key} = req.body;

    if (token != '' && key == token){
        token = '';
        clearTimeout(resetTimer);
        await configService.setItem(IplayarrParameter.AUTH_USERNAME, configService.defaultConfigMap.AUTH_USERNAME);
        await configService.setItem(IplayarrParameter.AUTH_PASSWORD, configService.defaultConfigMap.AUTH_PASSWORD)
    }

    res.json({status : true});
});

export default router;