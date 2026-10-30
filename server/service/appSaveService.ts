import { App } from '../types/App';
import { ApiError, ApiResponse } from '../types/responses/ApiResponse';
import { AppFormValidator } from '../validators/AppFormValidator';
import appService from './appService';

export interface AppSaveResult {
    status: number;
    body: App | ApiResponse;
}

/** Validates and saves an app (creating or updating it), then syncs its integrations with the arr app. */
export async function saveApp(form: App, mode: 'add' | 'update'): Promise<AppSaveResult> {
    const appServiceMethod = mode === 'add' ? 'addApp' : 'updateApp';
    const validationResult = await new AppFormValidator().validate(form);
    const invalid = (): AppSaveResult => ({
        status: 400,
        body: { error: ApiError.INVALID_INPUT, invalid_fields: validationResult } as ApiResponse,
    });

    if (Object.keys(validationResult).length != 0) {
        return invalid();
    }

    const updatedForm: App | undefined = await appService[appServiceMethod](form);
    if (!updatedForm) {
        validationResult['name'] = 'Error Saving App';
        return invalid();
    }

    try {
        await appService.createUpdateIntegrations(updatedForm);
    } catch (err: any) {
        if (err.type == 'download_client') {
            validationResult['download_client_name'] = err?.message;
        } else {
            validationResult['indexer_name'] = err?.message;
            validationResult['indexer_priority'] = err?.message;
        }

        //Delete the half complete app if it's new
        if (mode === 'add') {
            await appService.removeApp(updatedForm.id);
        }
        return invalid();
    }
    return { status: 200, body: updatedForm };
}
