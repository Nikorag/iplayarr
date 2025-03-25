import storage from 'node-persist';
import { v4 } from 'uuid';

import nzbFacade from '../facade/nzbFacade';
import { App } from '../types/App';
import { appCategories, AppFeature, appFeatures, AppType } from '../types/AppType';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { CreateDownloadClientForm } from '../types/requests/form/CreateDownloadClientForm';
import { CreateIndexerForm } from '../types/requests/form/CreateIndexerForm';
import arrService, { ArrConfig } from './arrService';
import configService from './configService';
import socketService from './socketService';

let isStorageInitialized : boolean = false;

const storageOptions : any = {};
if (process.env.STORAGE_LOCATION){
    storageOptions.dir = process.env.STORAGE_LOCATION;
}

const appService = {
    initStorage : async () : Promise<void> => {
        if (!isStorageInitialized) {
            await storage.init(storageOptions);
            isStorageInitialized = true;
        }
    },
    
    getAllApps : async () : Promise<App[]> => {
        await appService.initStorage();
        return (await storage.getItem('apps')) || [];
    },

    getApp : async (id : string) : Promise<App | undefined> => {
        const allApps : App[] = await appService.getAllApps();
        return allApps.find(({id : app_id}) => app_id == id);
    },

    removeApp : async (id : string) : Promise<boolean> => {
        let allApps : App[] = await appService.getAllApps();
        allApps = allApps.filter(({id : app_id}) => app_id != id);
        await storage.setItem('apps', allApps);
        return true;
    },

    updateApp : async (form : Partial<App>) : Promise<App | undefined> => {
        if (form.id){
            let app : App | undefined = await appService.getApp(form.id);
            if (app){
                app = {
                    ...app,
                    ...form
                }
                await appService.removeApp(form.id);
                await appService.addApp(app);
                return app;
            }
        }
        return;
    },

    addApp : async (form : App) : Promise<App | undefined> => {
        if (!form.id){
            const id = v4();
            form.id = id;
        }
        const allApps : App[] = await appService.getAllApps();
        allApps.push(form);
        await storage.setItem('apps', allApps);
        return form;
    },

    createUpdateIntegrations : async (input : App, allowCreate : boolean = true) : Promise<App> => {
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

        await appService.updateApp(form);
        return form;
    },

    updateApiKey : async () : Promise<void> => {
        const allApps : App[] = await appService.getAllApps();
        const apiKeyApps : App[] = allApps.filter(({type}) => appFeatures[type].includes(AppFeature.CALLBACK));

        apiKeyApps.forEach((app : App) => {
            socketService.emit('app_update_status', {id : app.id, status : 'In Progress'});

            appService.createUpdateIntegrations(app).then(() => {
                socketService.emit('app_update_status', {id : app.id, status : 'Complete'});
            }).catch((err) => {
                socketService.emit('app_update_status', {id : app.id, status : 'Error', message : err.message});
            });
        })
    },

    testAppConnection : async (form : App) : Promise<string | boolean> => {
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
	    const useSSL : boolean = typeof form.iplayarr.useSSL === 'boolean' ? form.iplayarr.useSSL : form.iplayarr.useSSL === 'true';
            const createIndexerForm: CreateIndexerForm = {
                appId : form.id,
                name: form.indexer.name,
                downloadClientId: form.download_client.id,
                url: `http${useSSL ? 's' : ''}://${form.iplayarr.host}:${form.iplayarr.port}`,
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
            const useSSL : boolean = typeof form.iplayarr.useSSL === 'boolean' ? form.iplayarr.useSSL : form.iplayarr.useSSL === 'true';
	    const createIndexerForm: CreateIndexerForm = {
                appId : form.id,
                name: form.indexer.name,
                downloadClientId: form.download_client.id,
                url: `http${useSSL ? 's' : ''}://${form.iplayarr.host}:${form.iplayarr.port}`,
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
    },
    [AppFeature.LINK]: async (form: App): Promise<App> => {
        return form;
    }
}

export default appService;
