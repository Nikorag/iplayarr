import episodeCacheService from '../service/episodeCacheService';
import { IPlayerDataLayerResponse } from '../types/responses/iplayer/EpisodeCacheTypes';
import { Validator } from './Validator';

export class OffScheduleFormValidator extends Validator {

    async validate({url}: any): Promise<{ [key: string]: string; }> {
        const validatorError : { [key: string]: string; } = {};
        const details : IPlayerDataLayerResponse | undefined = await episodeCacheService.getDetailScript(url);
        if (!details){
            validatorError.url = 'Invalid URL'
        }
        return validatorError;
    }

}