import episodeCacheService from '../service/episodeCacheService';
import { Validator } from './Validator';

export class OffScheduleFormValidator extends Validator {

    async validate({url}: any): Promise<{ [key: string]: string; }> {
        const validatorError : { [key: string]: string; } = {};
        const brandPid : string | undefined = await episodeCacheService.findBrandForUrl(url);
        if (!brandPid){
            validatorError.url = 'Invalid URL'
        }
        return validatorError;
    }

}