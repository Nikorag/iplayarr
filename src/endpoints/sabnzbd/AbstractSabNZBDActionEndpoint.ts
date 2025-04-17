import { NextFunction,Request, Response } from 'express';

import { EndpointDirectory } from '../../constants/EndpointDirectory';

export interface ActionQueryString {
    name? : string
    value? : string
}

export class AbstractSabNZBDActionEndpoint {
    actionDirectory : EndpointDirectory;

    constructor(actionDirectory : EndpointDirectory){
        this.actionDirectory = actionDirectory;
    }

    async handler(req : Request, res : Response, next : NextFunction) {
        const name = (req.query as ActionQueryString).name ?? '_deault';
        this.actionDirectory[name](req, res, next);
    }
}