import { defineEventHandler, readBody, sendRedirect } from 'h3';

import OIDCService from '../../../service/auth/OIDCService';

export default defineEventHandler(async (event) => {
    const { OIDC_CONFIG_URL, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_CALLBACK_HOST } = await readBody(event);
    const authUrl = await OIDCService.oidcConnection(
        event,
        OIDC_CONFIG_URL,
        OIDC_CLIENT_ID,
        OIDC_CLIENT_SECRET,
        OIDC_CALLBACK_HOST,
        'test'
    );
    return sendRedirect(event, authUrl);
});
