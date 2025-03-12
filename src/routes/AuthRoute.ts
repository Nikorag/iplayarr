import {Express, NextFunction,Request, Response, Router} from 'express';
import session from 'express-session'
import { v4 } from 'uuid';

import configService from '../service/configService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';
import User from '../types/User'
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

    app.use('/json-api/*', (req: Request, res: Response, next: NextFunction) => {    
        if (!req.session?.user) {
            res.status(401).json({ error: ApiError.NOT_AUTHORISED } as ApiResponse);
            return;
        }
        next();
    });    
}

router.post('/login', async (req: Request, res: Response) => {
    const [AUTH_USERNAME, AUTH_PASSWORD] = await Promise.all([
        configService.getParameter(IplayarrParameter.AUTH_USERNAME),
        configService.getParameter(IplayarrParameter.AUTH_PASSWORD),
    ])
    const { username, password } = req.body;

    // Replace this with actual authentication logic
    if (username === AUTH_USERNAME && md5(password) === AUTH_PASSWORD) {
        req.session.user = { username };
        res.json(true);
        return;
    }

    res.status(401).json({ error : ApiError.INVALID_CREDENTIALS} as ApiResponse);

});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.json(true);
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

router.get('/generateToken', (_ : Request, res : Response) => {
    token = v4();
    console.log(`FORGOT PASSWORD TOKEN: ${token} This expires in 5 minutes`);
    if (resetTimer){
        clearTimeout(resetTimer);
    }
    resetTimer = setTimeout(() => token='', 300000);
    res.json(true);
});

router.post('/resetPassword', async (req : Request, res : Response) => {
    const {key} = req.body;

    if (token != '' && key == token){
        token = '';
        clearTimeout(resetTimer);
        await configService.setParameter(IplayarrParameter.AUTH_USERNAME, configService.defaultConfigMap.AUTH_USERNAME);
        await configService.setParameter(IplayarrParameter.AUTH_PASSWORD, configService.defaultConfigMap.AUTH_PASSWORD)
    }

    res.json(true);
});

export default router;