import { Request, Response } from 'express';

import AbstractStorageService from '../../service/abstractStorageService';
import appService from '../../service/appService';
import { appFeatures } from '../../shared/types/enums/AppType';
import { App } from '../../shared/types/models/App';
import { ApiError, ApiResponse } from '../../shared/types/responses/ApiResponse';
import { AppFormValidator } from '../../validators/AppFormValidator';
import { AbstractStorageRoute } from './AbstractStorageRoute';

const route = new (class extends AbstractStorageRoute<App>{
    create(app: App): Promise<App | ApiResponse> {
        return this.upsert(app, 'setItem');
    }

    update(app: App): Promise<App | ApiResponse> {
        return this.upsert(app, 'updateItem');
    }

    async upsert(app : App, appServiceMethod : keyof AbstractStorageService<App>) : Promise<App | ApiResponse> {
        const updatedForm : App | undefined = await (this.service[appServiceMethod] as any)(app);
        if (updatedForm){
            try {
                await appService.createUpdateIntegrations(updatedForm);
            } catch (err : any) {
                const validationResult : Record<string, string> = {};
                if (err.type == 'download_client'){
                    validationResult['download_client_name'] = err?.message;
                } else {
                    validationResult['indexer_name'] = err?.message;
                    validationResult['indexer_priority'] = err?.message;
                }

                //Delete the half complete app if it's new
                if (appServiceMethod === 'setItem'){
                    await appService.removeItem(updatedForm.id);
                }
                
                const apiResponse : ApiResponse = {
                    error : ApiError.INVALID_INPUT,
                    invalid_fields : validationResult
                }
                return apiResponse;
            } 
            return updatedForm;
        } else {
            const validationResult : Record<string, string> = {};
            validationResult['name'] = 'Error Saving App';
            const apiResponse : ApiResponse = {
                error : ApiError.INVALID_INPUT,
                invalid_fields : validationResult
            }
            return apiResponse;
        }
    }
})(appService, new AppFormValidator());
const router = route.getRouter();

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