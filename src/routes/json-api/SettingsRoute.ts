import { Request, Response, Router } from 'express';

import { version } from '../../config/version.json';
import configService, { ConfigMap } from '../../service/configService';
import { IplayarrParameter } from '../../types/IplayarrParameters';
import { qualityProfiles } from '../../types/QualityProfiles';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { comparePassword, hashPassword, isLegacyMD5Hash, md5 } from '../../utils/Utils';
import { ConfigFormValidator } from '../../validators/ConfigFormValidator';
import { Validator } from '../../validators/Validator';

const router = Router();

router.get('/hiddenSettings', (_, res: Response) => {
    res.json({
        HIDE_DONATE: Boolean(process.env.HIDE_DONATE) || false,
        VERSION: version,
    });
});

router.get('/', async (_, res: Response) => {
    const configMap: ConfigMap = await configService.getAllConfig();
    res.json(configMap);
});

router.put('/', async (req: Request, res: Response) => {
    const validator: Validator = new ConfigFormValidator();
    const validationResult: { [key: string]: string } = await validator.validate(req.body);
    if (Object.keys(validationResult).length > 0) {
        const apiResponse: ApiResponse = {
            error: ApiError.INVALID_INPUT,
            invalid_fields: validationResult,
        };
        res.status(400).json(apiResponse);
        return;
    }
    for (const key of Object.keys(req.body)) {
        const val = req.body[key];
        if (key == IplayarrParameter.AUTH_PASSWORD) {
            const existing = await configService.getParameter(IplayarrParameter.AUTH_PASSWORD);
            // Check if the submitted value is already the stored hash (no change)
            if (existing === val) {
                continue;
            }
            // Check if the plaintext matches the existing hash (no change)
            let alreadyMatches = false;
            if (existing) {
                if (isLegacyMD5Hash(existing)) {
                    alreadyMatches = md5(val) === existing;
                } else {
                    alreadyMatches = await comparePassword(val, existing);
                }
            }
            if (!alreadyMatches) {
                const hashed = await hashPassword(val);
                await configService.setParameter(key as IplayarrParameter, hashed);
            }
        } else {
            await configService.setParameter(key as IplayarrParameter, val);
        }
    }
    res.json(req.body);
});

router.get('/qualityProfiles', (_, res: Response) => {
    res.json(qualityProfiles);
});

export default router;
