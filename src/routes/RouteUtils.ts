import { Router } from 'express'

import { ServiceLibrary } from '../shared/ServiceLibrary'
import { AbstractStorageRoute } from './AbstractStorageRoute';

export const createRoutes = (router : Router) : void => {
    for (const {name,route,storageService} of ServiceLibrary){
        if (route){
            import(`./json-api/${route}`).then((module) => router.use(`/${name}`, module.default));
        } else if (storageService) {
            import(`../service/${storageService}`).then((module) => router.use(`/${name}`, new AbstractStorageRoute(module.default).router)); 
        }
    }
}
