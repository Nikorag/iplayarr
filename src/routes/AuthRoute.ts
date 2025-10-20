import { RedisStore } from 'connect-redis';
import { Express, NextFunction, Request, Response, Router } from 'express';
import session from 'express-session';
import { v4 } from 'uuid';

import OIDCService from '../service/auth/OIDCService';
import configService from '../service/configService';
import { redis } from '../service/redis/redisService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';
import User from '../types/User';
import { md5 } from '../utils/Utils';

declare module 'express-session' {
    interface SessionData {
        user: User;
        codeVerifier?: string;
        state?: string;
    }
}

const redisStore = new RedisStore({
    client: redis,
    prefix: 'iplayarr:',
});

const isDebug = process.env.DEBUG == 'true';
const router: Router = Router();

let token: string = '';
let resetTimer: NodeJS.Timeout | undefined;

export const addAuthMiddleware = (app: Express) => {
    const sessionCookieSettings: any = { secure: false, maxAge: 1000 * 60 * 60 * 24 };
    if (isDebug) {
        sessionCookieSettings.sameSite = 'lax';
    }

    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'default_secret_key', // Replace in production
            resave: false,
            saveUninitialized: false,
            cookie: sessionCookieSettings,
            store: redisStore,
        })
    );

    app.use('/json-api/*', async (req: Request, res: Response, next: NextFunction) => {
        const [authType, username] = await Promise.all([
            configService.getParameter(IplayarrParameter.AUTH_TYPE),
            configService.getParameter(IplayarrParameter.AUTH_USERNAME),
        ]);
        if (authType == 'none') {
            req.session.user = { username: username || 'admin' };
        }
        if (!req.session?.user) {
            res.status(401).json({ error: ApiError.NOT_AUTHORISED } as ApiResponse);
            return;
        }
        next();
    });
};

router.get('/method', async (req: Request, res: Response) => {
    const authType = await configService.getParameter(IplayarrParameter.AUTH_TYPE);
    res.json({ message: authType });
});

router.get('/oidc/login', async (req: Request, res: Response) => {
    const authType = await configService.getParameter(IplayarrParameter.AUTH_TYPE);
    if (authType != 'oidc') {
        res.status(400).json({ error: ApiError.OIDC_NOT_ENABLED } as ApiResponse);
        return;
    }

    const url = await OIDCService.getAuthURL(req);

    res.json({ url });
});

router.post('/oidc/test', async (req: Request, res: Response) => {
    const { OIDC_CONFIG_URL, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_CALLBACK_HOST } = req.body;
    const authUrl = await OIDCService.testConnection(req, OIDC_CONFIG_URL, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_CALLBACK_HOST);
    res.redirect(authUrl);
});

router.get('/oidc/callback', async (req: Request, res: Response) => {
    const allowedEmailsList = await configService.getParameter(IplayarrParameter.OIDC_ALLOWED_EMAILS) || '';
    const allowedEmails = allowedEmailsList.split(',').map(email => email.trim().toLowerCase());
    const code = req.query.code as string;
    const codeVerifier = req.session.codeVerifier;

    if (!code || !codeVerifier) {
        res.status(400).json({ error: ApiError.INVALID_INPUT } as ApiResponse);
        return;
    }

    const stateParam = req.query.state as string;
    const stateData = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    const isTest = stateData.mode === 'test';
    const email: string | undefined = isTest ?
        await OIDCService.getUserEmail(req, stateData.details.configUrl, stateData.details.clientId, stateData.details.clientSecret) :
        await OIDCService.validateUser(req);
    const validUser = email && allowedEmails.includes(email.toLowerCase());



    if (isTest) {
        res.send(`
    <html>
      <body>
        <script>
          const channel = new BroadcastChannel('oidc-test');
          channel.postMessage({
            type: 'oidc-test-result',
            success: true,
            email: "${email}"
          });
          setTimeout(() => window.close(), 500);
        </script>
        <p>You can close this tab.</p>
      </body>
    </html>
`);
        return;
    }

    if (!validUser) {
        res.status(401).json({ error: ApiError.INVALID_CREDENTIALS } as ApiResponse);
        return;
    } else {
        req.session.user = { username: email };
        const host = process.env.DEBUG == 'true' ? `${req.protocol}://${req.headers.host?.split(':')[0]}:8080` : '';
        res.redirect(`${host}/queue`);
        return;
    }
});


router.post('/login', async (req: Request, res: Response) => {
    const [AUTH_USERNAME, AUTH_PASSWORD] = await Promise.all([
        configService.getParameter(IplayarrParameter.AUTH_USERNAME),
        configService.getParameter(IplayarrParameter.AUTH_PASSWORD),
    ]);
    const { username, password } = req.body;

    if (username === AUTH_USERNAME && md5(password) === AUTH_PASSWORD) {
        req.session.user = { username };
        res.json({ status: true });
        return;
    }

    res.status(401).json({ error: ApiError.INVALID_CREDENTIALS } as ApiResponse);
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ status: true });
    });
});

router.get('/me', async (req: Request, res: Response) => {
    const [authType, username] = await Promise.all([
        configService.getParameter(IplayarrParameter.AUTH_TYPE),
        configService.getParameter(IplayarrParameter.AUTH_USERNAME),
    ]);
    if (authType == 'none') {
        req.session.user = { username: username || 'admin' };
    }
    if (!req.session?.user) {
        res.status(401).json({ error: ApiError.NOT_AUTHORISED } as ApiResponse);
        return;
    } else {
        res.json(req.session.user);
        return;
    }
});

router.get('/generateToken', (_: Request, res: Response) => {
    token = v4();
    console.log(`FORGOT PASSWORD TOKEN: ${token} This expires in 5 minutes`);
    if (resetTimer) {
        clearTimeout(resetTimer);
    }
    resetTimer = setTimeout(() => (token = ''), 300000);
    res.json({ status: true });
});

router.post('/resetPassword', async (req: Request, res: Response) => {
    const { key } = req.body;

    if (token != '' && key == token) {
        token = '';
        clearTimeout(resetTimer);
        await configService.setParameter(IplayarrParameter.AUTH_USERNAME, configService.defaultConfigMap.AUTH_USERNAME);
        await configService.setParameter(IplayarrParameter.AUTH_PASSWORD, configService.defaultConfigMap.AUTH_PASSWORD);
    }

    res.json({ status: true });
});

export default router;
