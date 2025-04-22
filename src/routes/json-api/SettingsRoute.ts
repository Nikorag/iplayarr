import { Request, Response, Router } from 'express';
import { version } from 'src/config/version.json'

import configService, { ConfigMap } from '../../service/configService';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { qualityProfiles } from '../../types/QualityProfiles';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { md5 } from '../../utils/Utils';
import { ConfigFormValidator } from '../../validators/ConfigFormValidator';
import { Validator } from '../../validators/Validator';

const router = Router();

router.get('/hiddenSettings', (_, res : Response) => {
    res.json(
        {
	 'HIDE_DONATE' : process.env.HIDE_DONATE || false,
            'VERSION' : version
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
