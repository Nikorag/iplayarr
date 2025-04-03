import appService from '../service/appService';
import { Validator } from './Validator';

export class AppFormValidator extends Validator {
    async validate(input: any): Promise<{[key: string]: string}> {
        const validatorError : { [key: string]: string; } = {};
        const testResult : string | boolean = await appService.testAppConnection(input);
        if (!input.name){
            validatorError['name'] = 'Please provide an App Name';
        }
        if (testResult != true){
            validatorError['api_key'] = testResult == false ? 'Error' : testResult as string;
            validatorError['url'] = testResult == false ? 'Error' : testResult as string;
        }
        if ((input.indexer?.name || input.indexer?.priority) && (!input.download_client?.name)){
            validatorError['indexer_name'] = 'Cannot create Indexer without Download Client' as string;
            validatorError['indexer_priority'] = 'Cannot create Indexer without Download Client' as string;
        }
        if (input.indexer?.priority && (input.indexer.priority < 0 || input.indexer.priority > 50)) {
            validatorError['indexer_priority'] = 'Priority must be between 0 and 50' as string;
        }
        if (input.priority && (input.priority < 0)) {
            validatorError['priority'] = 'Priority must be a positive number' as string;
        }
        return validatorError;
    }
}