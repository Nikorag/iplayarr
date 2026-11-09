import { getQuery, H3Event } from 'h3';

import { EndpointDirectory } from '../../constants/EndpointDirectory';

export interface ActionQueryString {
    name?: string
    value?: string
}

export class AbstractSabNZBDActionEndpoint {
    actionDirectory: EndpointDirectory;

    constructor(actionDirectory: EndpointDirectory) {
        this.actionDirectory = actionDirectory;
    }

    handler = async (event: H3Event) => {
        const name = (getQuery(event) as ActionQueryString).name ?? '_default';
        return this.actionDirectory[name](event);
    }
}
