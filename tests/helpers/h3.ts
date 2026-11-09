import { createApp, createEvent, createRouter, EventHandler, H3Event, RouterMethod, toNodeListener } from 'h3';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import request from 'supertest';

export type RouteDefinition = [method: RouterMethod, path: string, handler: EventHandler];

/**
 * Mounts Nitro-style event handlers on a throwaway h3 app so they can be exercised over HTTP with supertest.
 * Paths use h3 router syntax, e.g. '/lookup/:appId'.
 */
export function mountRoutes(routes: RouteDefinition[]) {
    const app = createApp();
    const router = createRouter();
    routes.forEach(([method, path, handler]) => router.add(path, handler, method));
    app.use(router);
    return app;
}

export function testRequest(routes: RouteDefinition[]) {
    return request(toNodeListener(mountRoutes(routes)));
}

export function testAgent(routes: RouteDefinition[]) {
    return request.agent(toNodeListener(mountRoutes(routes)));
}

/** As mountRoutes, but returns a node request listener to pass straight to supertest's request(). */
export function nodeApp(routes: RouteDefinition[]) {
    return toNodeListener(mountRoutes(routes));
}

export interface EventOptions {
    query?: Record<string, string>;
    method?: string;
    headers?: Record<string, string>;
    localPort?: number;
}

/** Builds an H3Event without a running server, for calling endpoint handlers directly. */
export function makeEvent({ query = {}, method = 'GET', headers = {}, localPort }: EventOptions = {}): H3Event {
    const socket = new Socket();
    if (localPort !== undefined) {
        Object.defineProperty(socket, 'localPort', { value: localPort });
    }
    const req = new IncomingMessage(socket);
    req.method = method;
    req.url = `/?${new URLSearchParams(query).toString()}`;
    Object.assign(req.headers, headers);
    return createEvent(req, new ServerResponse(req));
}

export const responseHeader = (event: H3Event, name: string) => event.node.res.getHeader(name);
