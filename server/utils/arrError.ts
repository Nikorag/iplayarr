import axios from 'axios';

const NETWORK_ERRORS: Record<string, string> = {
    ECONNREFUSED: 'connection refused',
    ENOTFOUND: 'host not found',
    ETIMEDOUT: 'connection timed out',
    ECONNABORTED: 'connection timed out',
    EHOSTUNREACH: 'host unreachable',
};

/** Pulls the useful text out of a Servarr error body, which is either a list of validation failures or a single message. */
function bodyMessage(data: unknown): string | undefined {
    if (Array.isArray(data)) {
        const messages = data
            .map((item) => {
                if (!item || typeof item !== 'object') return undefined;
                const { propertyName, errorMessage } = item as { propertyName?: string; errorMessage?: string };
                if (!errorMessage) return undefined;
                return propertyName ? `${propertyName}: ${errorMessage}` : errorMessage;
            })
            .filter((message): message is string => !!message);
        return messages.length > 0 ? messages.join('; ') : undefined;
    }
    if (data && typeof data === 'object') {
        const { errorMessage, message } = data as { errorMessage?: string; message?: string };
        return errorMessage || message;
    }
    return undefined;
}

/** Turns an error from a Sonarr/Radarr/Prowlarr call into a message that is useful to show the user. */
export function formatArrError(err: unknown): string {
    if (!axios.isAxiosError(err)) {
        return err instanceof Error ? err.message : String(err);
    }

    const status = err.response?.status;
    const detail = bodyMessage(err.response?.data);

    if (status === 401 || status === 403) {
        return 'Authentication failed, check the API key';
    }
    if (status === 404) {
        return detail ?? 'Not found, check the URL and that the app version is supported';
    }
    if (status) {
        return detail ?? `Request failed with status code ${status}`;
    }
    const network = err.code ? NETWORK_ERRORS[err.code] : undefined;
    return network ? `Could not connect: ${network}` : err.message;
}
