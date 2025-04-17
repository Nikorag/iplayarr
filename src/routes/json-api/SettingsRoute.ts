import { Request, Response, Router } from 'express';
import { qualityProfiles } from 'src/constants/QualityProfiles';
import configService, { ConfigMap } from 'src/service/configService';
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters';
import { ApiError, ApiResponse } from 'src/types/responses/ApiResponse';
import { md5 } from 'src/utils/Utils';
import { ConfigFormValidator } from 'src/validators/ConfigFormValidator';
import { Validator } from 'src/validators/Validator';

const router = Router();

router.get('/hiddenSettings', (_, res : Response) => {
    res.json(
        {
	 'HIDE_DONATE' : process.env.HIDE_DONATE || false,
            'VERSION' : process.env.VERSION ?? '0'
        }
    )
});

router.get('/', async (_, res : Response) => {
    const configMap : ConfigMap = await configService.getAllConfig();
    res.json(configMap);
});

router.put('/', async (req : Request, res : Response) => {
    const validator : Validator = new ConfigFormValidator();
    const validationResult : {[key:string] : string} = await validator.validate(req.body);
    if (Object.keys(validationResult).length > 0){
        const apiResponse : ApiResponse = {
            error : ApiError.INVALID_INPUT,
            invalid_fields : validationResult
        }
        res.status(400).json(apiResponse);
        return;
    }
    for (const key of Object.keys(req.body)){
        if (key != 'AUTH_PASSWORD'){
            await configService.setParameter(key as IplayarrParameter, req.body[key]);
        } else {
            const existingPassword = await configService.getParameter(IplayarrParameter.AUTH_PASSWORD);
            if (existingPassword != req.body[key]){
                await configService.setParameter(key as IplayarrParameter, md5(req.body[key]));
            }
        }
    }
    res.json(req.body);
});

router.get('/qualityProfiles', (_, res : Response) => {
    res.json(qualityProfiles);
});

export default router;
