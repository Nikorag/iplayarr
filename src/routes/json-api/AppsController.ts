import { Body,Controller, Delete, Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';

import appService from '../../service/appService';
import { AppFeature, appFeatures, AppType } from '../../types/constants/AppType';
import { App } from '../../types/models/App';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { AppFormValidator } from '../../validators/AppFormValidator';
import CrudBase from './CrudBase';



class AppCrud extends CrudBase<App> {

    async put(value : App) : Promise<App | undefined> {
        return await this.updateApp(value, 'put');
    }

    async post(value : App) : Promise<App | undefined> {
        return await this.updateApp(value, 'post');
    }

    async updateApp (form : App, appServiceMethod : 'post' | 'put') : Promise<App | undefined> {
        const updatedForm : App | undefined = await super[appServiceMethod](form);
        const validationResult : {[key:string] : string} = {};
        if (updatedForm){
            try {
                await appService.createUpdateIntegrations(updatedForm);
            } catch (err : any) {
                if (err.type == 'download_client'){
                    validationResult['download_client_name'] = err?.message;
                } else {
                    validationResult['indexer_name'] = err?.message;
                    validationResult['indexer_priority'] = err?.message;
                }
    
                //Delete the half complete app if it's new
                if (appServiceMethod === 'post'){
                    await appService.removeItem(updatedForm.id as string);
                }

                const api_response : ApiResponse = {
                    error : ApiError.INVALID_INPUT,
                    invalid_fields : validationResult
                }
                throw {
                    api_response,
                    message : 'Invalid'
                }
            } 
            return updatedForm;
        } else {
            validationResult['name'] = 'Error Saving App';
            const api_response : ApiResponse = {
                error : ApiError.INVALID_INPUT,
                invalid_fields : validationResult
            }
            throw {
                api_response,
                message : 'Invalid'
            }
        }
    }
}

@Route('json-api/apps')
@Tags('Apps')
@Security('api_key') 
export class AppsController extends Controller {
    private crud: CrudBase<App>;

    constructor() {
        super();
        const validator = new AppFormValidator();
        this.crud = new AppCrud(appService, validator);
    }

    @Get('/')
    public async getItems(): Promise<App[]> {
        return this.crud.errorWrapper(this, {}, async () => {
            return this.crud.get();
        }, false);
    }

    @Put('/')
    public async updateItem(@Body() value: App): Promise<App | undefined> {
        return this.crud.errorWrapper(this, value, async () => {
            return this.crud.put(value);
        });
    }

    @Post('/')
    public async createItem(@Body() value: App): Promise<App | undefined> {
        return this.crud.errorWrapper(this, value, async () => {
            return this.crud.post(value);
        });
    }

    @Delete('/{id}')
    public async deleteItem(@Path('id') id: string): Promise<boolean> {
        return this.crud.errorWrapper(this, {}, async () => {
            return this.crud.delete(id);
        }, false);
    }

    @Get('/types')
    public getTypes() :  Record<AppType, AppFeature[]> {
        return appFeatures;
    }

    @Post('/test')
    public async testAppConnection(@Body() form : App) : Promise<boolean> {
        const result = await appService.testAppConnection(form);
        if (result == true){
            return true;
        } else {
            this.setStatus(500);
            return Promise.reject({error: ApiError.INTERNAL_ERROR, message : result} as ApiResponse);
        }
    }

    @Post('/updateApiKey')
    public updateApiKey() : boolean {
        appService.updateApiKey();
        return true;
    }
}