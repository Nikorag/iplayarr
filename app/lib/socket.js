const RECONNECT_DELAY_MS = 2000;

/**
 * Opens the websocket to the server's push endpoint. Exposes the small on/off interface the app uses for
 * listening to events, and reconnects if the connection drops.
 */
export const connectSocket = () => {
    const listeners = {};
    let ws;
    let closed = false;

    const connect = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        ws = new WebSocket(`${protocol}://${window.location.host}/_ws`);

        ws.onmessage = ({ data }) => {
            try {
                const { event, data: payload } = JSON.parse(data);
                (listeners[event] ?? []).forEach((handler) => handler(payload));
            } catch {
                // Ignore malformed messages
            }
        };

        ws.onclose = () => {
            if (!closed) {
                setTimeout(connect, RECONNECT_DELAY_MS);
            }
        };
    };

    connect();

    return {
        on: (event, handler) => {
            (listeners[event] ??= []).push(handler);
        },
        off: (event) => {
            delete listeners[event];
        },
        close: () => {
            closed = true;
            ws.close();
        },
    };
};
