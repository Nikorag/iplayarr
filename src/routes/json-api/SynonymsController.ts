import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';

import appService from '../../service/appService';
import arrService from '../../service/arrService';
import searchHistoryService from '../../service/searchHistoryService';
import synonymService from '../../service/synonymService';
import { SearchHistoryEntry } from '../../types/data/SearchHistoryEntry';
import { App } from '../../types/models/App';
import { Synonym } from '../../types/models/Synonym';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { ArrLookupResponse } from '../../types/responses/arr/ArrLookupResponse';
import CrudBase from './CrudBase';

@Route('json-api/synonym')
@Tags('Synonyms')
@Security('api_key') 
export class SynonymsController extends Controller {
    private crud: CrudBase<Synonym>;

    constructor() {
        super();
        this.crud = new CrudBase(synonymService);
    }

    @Get('/')
    public async getItems(): Promise<Synonym[]> {
        return this.crud.errorWrapper(this, {}, async () => {
            return this.crud.get();
        }, false);
    }

    @Put('/')
    public async updateItem(@Body() value: Synonym): Promise<Synonym | undefined> {
        return this.crud.errorWrapper(this, value, async () => {
            return this.crud.put(value);
        });
    }

    @Post('/')
    public async createItem(@Body() value: Synonym): Promise<Synonym | undefined> {
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

    @Get('/searchHistory')
    public getSearchHistory() : SearchHistoryEntry[] {
        return searchHistoryService.getHistory();
    }

    @Get('/lookup/{appId}')
    public async lookupSynonym(@Path('appId') appId : string, @Query('term') term? : string) : Promise<ArrLookupResponse[]> {
        const app : App | undefined = await appService.getItem(appId);
        if (app){
            try {
                const results : ArrLookupResponse[] = await arrService.search(app, term);
                return results;
            } catch (err : any) {
                const apiResponse : ApiResponse = {
                    error : ApiError.INTERNAL_ERROR,
                    message : err?.message
                }
                this.setStatus(400);
                return Promise.reject(apiResponse);
            }
        }
        const apiResponse : ApiResponse = {
            error : ApiError.INTERNAL_ERROR,
            message : `App ${appId} not found`
        }
        this.setStatus(400);
        return Promise.reject(apiResponse);
    }
}