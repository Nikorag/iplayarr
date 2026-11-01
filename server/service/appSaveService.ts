import arrFacade from '../facade/arrFacade';
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
    const invalid = (message?: string): AppSaveResult => ({
        status: 400,
        body: { error: ApiError.INVALID_INPUT, invalid_fields: validationResult, message } as ApiResponse,
    });

    if (Object.keys(validationResult).length != 0) {
        return invalid();
    }

    const updatedForm: App | undefined = await appService[appServiceMethod](form);
    if (!updatedForm) {
        validationResult['name'] = 'Error Saving App';
        return invalid('Error saving app');
    }

    const hadDownloadClient = !!updatedForm.download_client?.id;

    try {
        await appService.createUpdateIntegrations(updatedForm);
    } catch (err: any) {
        let message: string = err?.message ?? 'Unknown error';
        if (err?.type == 'download_client') {
            validationResult['download_client_name'] = message;
            message = `Failed to create the download client: ${message}`;
        } else {
            validationResult['indexer_name'] = message;
            validationResult['indexer_priority'] = message;
            message = `Failed to create the indexer: ${message}`;

            // The download client was created in this attempt, remove it so a retry doesn't create a duplicate
            if (!hadDownloadClient && updatedForm.download_client?.id) {
                try {
                    await arrFacade.deleteDownloadClient(updatedForm, updatedForm.download_client.id);
                } catch (cleanupErr: any) {
                    message += `. The download client '${updatedForm.download_client.name}' was created but could not be removed: ${cleanupErr?.message}`;
                }
            }
        }

        //Delete the half complete app if it's new
        if (mode === 'add') {
            await appService.removeApp(updatedForm.id);
        }
        return invalid(message);
    }
    return { status: 200, body: updatedForm };
}
