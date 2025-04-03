import { Request, Response,Router } from 'express';

import appService from '../../service/appService';
import { appFeatures } from '../../types/constants/AppType';
import { App } from '../../types/models/App';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { AppFormValidator } from '../../validators/AppFormValidator';
import CrudRoute from './CrudRoute';

class AppsRoute extends CrudRoute<App> {

    async put(value : App) : Promise<App | undefined> {
        return await this.updateApp(value, 'put');
    }

    async post(value : App) : Promise<App | undefined> {
        return await this.updateApp(value, 'post');
    }

    async updateApp (form : App, appServiceMethod : 'post' | 'put') : Promise<App | undefined> {
        const updatedForm : App | undefined = await super[appServiceMethod](form);
        const validationResult : {[key:string] : string} = {};
        if (updatedForm){
            try {
                await appService.createUpdateIntegrations(updatedForm);
            } catch (err : any) {
                if (err.type == 'download_client'){
                    validationResult['download_client_name'] = err?.message;
                } else {
                    validationResult['indexer_name'] = err?.message;
                    validationResult['indexer_priority'] = err?.message;
                }
    
                //Delete the half complete app if it's new
                if (appServiceMethod === 'post'){
                    await appService.removeItem(updatedForm.id as string);
                }

                const api_response : ApiResponse = {
                    error : ApiError.INVALID_INPUT,
                    invalid_fields : validationResult
                }
                throw {
                    api_response,
                    message : 'Invalid'
                }
            } 
            return updatedForm;
        } else {
            validationResult['name'] = 'Error Saving App';
            const api_response : ApiResponse = {
                error : ApiError.INVALID_INPUT,
                invalid_fields : validationResult
            }
            throw {
                api_response,
                message : 'Invalid'
            }
        }
    }
}

const router : Router = new AppsRoute(appService, new AppFormValidator()).router;

router.get('/types', async (_, res :Response) => {
    res.json(appFeatures);
});

router.post('/test', async (req : Request, res : Response) => {
    const result = await appService.testAppConnection(req.body);
    if (result == true){
        res.json({status : true});
    } else {
        res.status(500).json({error: ApiError.INTERNAL_ERROR, message : result} as ApiResponse)
    }
    return;
});

router.post('/updateApiKey', async (_, res : Response) => {
    appService.updateApiKey();
    res.json(true);
});

export default router;