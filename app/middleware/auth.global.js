import { getHost } from '@/lib/utils';

export default defineNuxtRouteMiddleware(async (to) => {
    if (to.path == '/login') {
        return;
    }
    const { $authState: authState } = useNuxtApp();

    try {
        const res = await fetch(`${getHost()}/auth/me`, { credentials: 'include' });
        if (res.ok) {
            authState.user = await res.json(); // Store user data globally
            return;
        }
    } catch {
        // Treat a failed request the same as being logged out
    }
    authState.user = null;
    return navigateTo('/login');
});
