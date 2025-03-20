import nzbFacade from '../facade/nzbFacade';
import { appCategories, AppFeature, appFeatures, AppType } from '../shared/types/enums/AppType';
import { IplayarrParameter } from '../shared/types/enums/IplayarrParameters';
import { App } from '../shared/types/models/App';
import { CreateDownloadClientForm } from '../shared/types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../shared/types/requests/form/CreateIndexerForm';
import AbstractStorageService from './abstractStorageService';
import arrService, { ArrConfig } from './arrService';
import configService from './configService';
import socketService from './socketService';

class AppService extends AbstractStorageService<App> {

    async createUpdateIntegrations(input : App, allowCreate : boolean = true) : Promise<App> {
        let form = input;
        const features : AppFeature[] = appFeatures[form.type];

        const arrConfig : ArrConfig = {
            HOST : form.url,
            API_KEY : form.api_key || '',
            DOWNLOAD_CLIENT_ID : form.download_client?.id || undefined,
            INDEXER_ID : form.indexer?.id || undefined
        }

        for (const feature of features){
            try {
                form = await createUpdateFeature[feature](form, arrConfig, allowCreate);
            } catch (err){
                throw err;
            }
        }

        await this.updateItem(form);
        return form;
    }

    async updateApiKey() : Promise<void> {
        const allApps : App[] = await this.all();
        const apiKeyApps : App[] = allApps.filter(({type}) => appFeatures[type].includes(AppFeature.CALLBACK));

        apiKeyApps.forEach((app : App) => {
            socketService.emit('app_update_status', {id : app.id, status : 'In Progress'});

            this.createUpdateIntegrations(app).then(() => {
                socketService.emit('app_update_status', {id : app.id, status : 'Complete'});
            }).catch((err) => {
                socketService.emit('app_update_status', {id : app.id, status : 'Error', message : err.message});
            });
        })
    }

    async testAppConnection(form : App) : Promise<string | boolean> {
        switch (form.type){
        case AppType.PROWLARR:
        case AppType.RADARR:
        case AppType.SONARR: {
            return await arrService.testConnection({API_KEY : form.api_key as string, HOST : form.url});
        }
        case AppType.NZBGET:
        case AppType.SABNZBD: {
            return await nzbFacade.testConnection(form.type.toString().toLowerCase(), form.url, form.api_key, form.username, form.password); 
        }
        default:
            return false; 
        }
    }
}

const createUpdateFeature : Record<AppFeature, (form : App, arrConfig : ArrConfig, allowCreate : boolean) => Promise<App>> = {
    [AppFeature.DOWNLOAD_CLIENT]: async (form: App, arrConfig: ArrConfig, allowCreate : boolean = true): Promise<App> => {
        const API_KEY: string = await configService.getParameter(IplayarrParameter.API_KEY) as string;

        if (form.download_client?.name) {
            const createDownloadClientForm: CreateDownloadClientForm = {
                name: form.download_client.name,
                host: form.iplayarr.host as string,
                port: form.iplayarr.port as number,
                useSSL: form.iplayarr.useSSL,
                apiKey: API_KEY,
            };


            try {
                const id = await arrService.createUpdateDownloadClient(createDownloadClientForm, arrConfig, false, allowCreate);
                form.download_client.id = id;
            } catch (err: any) {
                throw {
                    message: err.message,
                    type: 'download_client', // Add the type
                };
            }
        }
        return form;
    },
    [AppFeature.INDEXER]: async (form: App, arrConfig: ArrConfig, allowCreate : boolean = true): Promise<App> => {
        const API_KEY: string = await configService.getParameter(IplayarrParameter.API_KEY) as string;

        if (form.download_client?.id && form.indexer?.name) {
            const createIndexerForm: CreateIndexerForm = {
                appId : form.id,
                name: form.indexer.name,
                downloadClientId: form.download_client.id,
                url: `http${form.iplayarr.useSSL ? 's' : ''}://${form.iplayarr.host}:${form.iplayarr.port}`,
                apiKey: API_KEY,
                categories: appCategories[form.type],
                priority: form.indexer.priority
            };

            try {
                const id = await arrService.createUpdateIndexer(createIndexerForm, arrConfig, allowCreate);
                form.indexer.id = id;
            } catch (err: any) {
                throw {
                    message: err.message,
                    type: 'indexer', // Add the type
                };
            }
        }
        return form;
    },
    [AppFeature.PROWLARR_DOWNLOAD_CLIENT]: async (form: App, arrConfig: ArrConfig, allowCreate : boolean = true): Promise<App> => {
        const API_KEY: string = await configService.getParameter(IplayarrParameter.API_KEY) as string;

        if (form.download_client?.name) {
            const createDownloadClientForm: CreateDownloadClientForm = {
                name: form.download_client.name,
                host: form.iplayarr.host as string,
                port: form.iplayarr.port as number,
                useSSL: form.iplayarr.useSSL,
                apiKey: API_KEY,
            };


            try {
                const id = await arrService.createUpdateDownloadClient(createDownloadClientForm, arrConfig, true, allowCreate);
                form.download_client.id = id;
            } catch (err: any) {
                throw {
                    message: err.message,
                    type: 'download_client', // Add the type
                };
            }
        }
        return form;
    },
    [AppFeature.PROWLARR_INDEXER]: async (form: App, arrConfig: ArrConfig, allowCreate : boolean = true): Promise<App> => {
        const API_KEY: string = await configService.getParameter(IplayarrParameter.API_KEY) as string;

        if (form.download_client?.id && form.indexer?.name) {
            const createIndexerForm: CreateIndexerForm = {
                appId : form.id,
                name: form.indexer.name,
                downloadClientId: form.download_client.id,
                url: `http${form.iplayarr.useSSL ? 's' : ''}://${form.iplayarr.host}:${form.iplayarr.port}`,
                apiKey: API_KEY,
                categories: appCategories[form.type],
                priority: form.indexer.priority
            };

            try {
                const id = await arrService.createUpdateProwlarrIndexer(createIndexerForm, arrConfig, allowCreate);
                form.indexer.id = id;
            } catch (err: any) {
                throw {
                    message: err.message,
                    type: 'indexer', // Add the type
                };
            }
        }
        return form;
    },
    [AppFeature.CALLBACK]: async (form: App): Promise<App> => {
        return form;
    },
    [AppFeature.API_KEY]: async (form: App): Promise<App> => {
        return form;
    },
    [AppFeature.USERNAME_PASSWORD]: async (form: App): Promise<App> => {
        return form;
    },
    [AppFeature.PRIORITY]: async (form: App): Promise<App> => {
        return form;
    }
}

export default new AppService('apps');