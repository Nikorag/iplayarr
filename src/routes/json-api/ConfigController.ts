import { Body, Controller, Get, Put, Route, Security, Tags } from 'tsoa';

import configService, { ConfigMap } from '../../service/configService';
import { QualityProfile, qualityProfiles } from '../../types/constants/QualityProfiles';
import { IplayarrParameter } from '../../types/enums/IplayarrParameters';
import { ApiError,ApiResponse } from '../../types/responses/ApiResponse';
import { md5 } from '../../utils/Utils';
import { ConfigFormValidator } from '../../validators/ConfigFormValidator';
import { Validator } from '../../validators/Validator';

@Route('json-api/config')
@Tags('Config')
@Security('api_key')
export class ConfigController extends Controller {

    @Get('/')
    public async getAllConfig(): Promise<ConfigMap> {
        return configService.getAllConfig();
    }

    @Put('/')
    public async updateConfig(@Body() value: ConfigMap): Promise<ConfigMap> {
        const validator: Validator = new ConfigFormValidator();
        const validationResult: { [key: string]: string } = await validator.validate(value);
        if (Object.keys(validationResult).length > 0) {
            const apiResponse: ApiResponse = {
                error: ApiError.INVALID_INPUT,
                invalid_fields: validationResult
            }
            this.setStatus(400);
            return Promise.reject(apiResponse);
        }
        for (const key of Object.keys(value)) {
            if (key != 'AUTH_PASSWORD') {
                await configService.setItem(key as IplayarrParameter, value[key]);
            } else {
                const existingPassword = await configService.getItem(IplayarrParameter.AUTH_PASSWORD);
                if (existingPassword != value[key]) {
                    await configService.setItem(key as IplayarrParameter, md5(value[key]));
                }
            }
        }
        return value;
    }

    @Get('/hiddenSettings')
    public getHiddenSettings() {
        return { 'HIDE_DONATE': process.env.HIDE_DONATE || false };
    }

    @Get('/qualityProfiles')
    public getQualityProfiles() : QualityProfile[] {
        return qualityProfiles;
    }
}