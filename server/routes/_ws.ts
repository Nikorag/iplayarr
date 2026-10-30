import { defineWebSocketHandler } from 'h3';

import sessionService from '../service/auth/sessionService';
import socketService from '../service/socketService';

// Pushes queue, history, log and app update events to the browser. Requires a logged in user unless AUTH_TYPE is 'none'.
export default defineWebSocketHandler({
    async upgrade(request) {
        if (!(await sessionService.getUserByCookieHeader(request.headers.get('cookie')))) {
            return new Response('Unauthorized', { status: 401 });
        }
    },

    open(peer) {
        socketService.registerSocket(peer);
    },

    close(peer) {
        socketService.removeSocket(peer);
    },
});
