import { Request, Response,Router } from 'express';

import appService from '../../service/appService';
import { appFeatures } from '../../types/enums/AppType';
import { App } from '../../types/models/App';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { AppFormValidator } from '../../validators/AppFormValidator';

const router = Router();

router.get('/', async (_, res : Response) => {
    const allApps : App[] = await appService.getAllApps();
    res.json(allApps);
});

const updateApp = async (req : Request, res : Response) => {
    const appServiceMethod = req.method === 'POST' ? 'addApp' : 'updateApp';
    const appFormValidator : AppFormValidator = new AppFormValidator();
    const form : App = req.body as any as App;
    const validationResult = await appFormValidator.validate(form);
    if (Object.keys(validationResult).length == 0){
        const updatedForm : App | undefined = await appService[appServiceMethod](form);
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
                if (req.method === 'POST'){
                    await appService.removeApp(updatedForm.id);
                }
                
                const apiResponse : ApiResponse = {
                    error : ApiError.INVALID_INPUT,
                    invalid_fields : validationResult
                }
                res.status(400).json(apiResponse);
                return;
            } 
            res.json(updatedForm);
        } else {
            validationResult['name'] = 'Error Saving App';
            const apiResponse : ApiResponse = {
                error : ApiError.INVALID_INPUT,
                invalid_fields : validationResult
            }
            res.status(400).json(apiResponse);
        }
    } else {
        const apiResponse : ApiResponse = {
            error : ApiError.INVALID_INPUT,
            invalid_fields : validationResult
        }
        res.status(400).json(apiResponse);
        return;
    }
};

router.post('/', updateApp);
router.put('/', updateApp);

router.delete('/', async (req : Request, res : Response) => {
    const {id} = req.body;
    await appService.removeApp(id);
    res.json(true);
});

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