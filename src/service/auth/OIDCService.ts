import { Request } from 'express';
import * as client from 'openid-client'

import { IplayarrParameter } from '../../types/IplayarrParameters';
import configService from '../configService';

class OIDCService {
    async testConnection(req: Request, configUrl: string, clientId: string, clientSecret: string, callback_host: string): Promise<string> {
        const config: client.Configuration = await client.discovery(
            new URL(configUrl),
            clientId,
            clientSecret,
        )

        const codeVerifier = client.randomPKCECodeVerifier()
        req.session.codeVerifier = codeVerifier
        const code_challenge = await client.calculatePKCECodeChallenge(codeVerifier)
        const statePayload = {
            mode: 'test',
            details: { configUrl, clientId, clientSecret, callback_host },
            nonce: client.randomState()
        };
        const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');
        req.session.state = state

        const parameters: Record<string, string> = {
            redirect_uri: `${callback_host}/auth/oidc/callback`,
            scope: 'openid profile email',
            code_challenge,
            code_challenge_method: 'S256',
            state
        }

        return client.buildAuthorizationUrl(config, parameters).toString();
    }

    async getAuthURL(req: Request): Promise<string | undefined> {
        const [configUrl, clientId, clientSecret] = (await configService.getParameters(
            IplayarrParameter.OIDC_CONFIG_URL,
            IplayarrParameter.OIDC_CLIENT_ID,
            IplayarrParameter.OIDC_CLIENT_SECRET
        )) as string[];

        return await this.getUserEmail(req, configUrl, clientId, clientSecret);
    }

    async getUserEmail(req: Request, configUrl: string, clientId: string, clientSecret: string): Promise<string | undefined> {
        try {
            const config: client.Configuration = await client.discovery(
                new URL(configUrl),
                clientId,
                clientSecret,
            )

            const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            const tokens: client.TokenEndpointResponse = await client.authorizationCodeGrant(
                config,
                new URL(fullUrl),
                {
                    pkceCodeVerifier: req.session.codeVerifier,
                    expectedState: req.session.state
                },
            )

            const serverMetadata = config.serverMetadata();

            const protectedResourceResponse: Response = await client.fetchProtectedResource(
                config,
                tokens.access_token,
                new URL(serverMetadata.userinfo_endpoint!),
                'GET',
            )

            const { email } = await protectedResourceResponse.json();

            return email;
        } catch (e: any) {
            console.error('OIDC validation error:', e);
            return;
        }
    }

    async validateUser(req: Request): Promise<string | undefined> {
        try {
            const [configUrl, clientId, clientSecret] = (await configService.getParameters(
                IplayarrParameter.OIDC_CONFIG_URL,
                IplayarrParameter.OIDC_CLIENT_ID,
                IplayarrParameter.OIDC_CLIENT_SECRET
            )) as string[];

            const config: client.Configuration = await client.discovery(
                new URL(configUrl),
                clientId,
                clientSecret,
            )

            const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            const tokens: client.TokenEndpointResponse = await client.authorizationCodeGrant(
                config,
                new URL(fullUrl),
                {
                    pkceCodeVerifier: req.session.codeVerifier,
                    expectedState: req.session.state
                },
            )

            const serverMetadata = config.serverMetadata();

            const protectedResourceResponse: Response = await client.fetchProtectedResource(
                config,
                tokens.access_token,
                new URL(serverMetadata.userinfo_endpoint!),
                'GET',
            )

            const { email } = await protectedResourceResponse.json();

            return email;
        } catch (e: any) {
            console.error('OIDC validation error:', e);
            return;
        }
    }
}

export default new OIDCService();