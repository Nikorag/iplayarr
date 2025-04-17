import { NextFunction,Request, Response } from 'express';
import { EndpointDirectory } from 'src/constants/EndpointDirectory';

export interface ActionQueryString {
    name? : string
    value? : string
}

export class AbstractSabNZBDActionEndpoint {
    actionDirectory : EndpointDirectory;

    constructor(actionDirectory : EndpointDirectory){
        this.actionDirectory = actionDirectory;
    }

    handler = async (req : Request, res : Response, next : NextFunction) => {
        const name = (req.query as ActionQueryString).name ?? '_default';
        this.actionDirectory[name](req, res, next);
    }
}
