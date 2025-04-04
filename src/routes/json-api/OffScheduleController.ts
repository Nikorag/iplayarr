import { Body, Controller, Delete,Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';

import offScheduleService from '../../service/offScheduleService';
import { EpisodeCacheDefinition } from '../../types/models/EpisodeCacheDefinition';
import CrudBase from './CrudBase';

@Route('json-api/offSchedule')
@Tags('Off Schedule')
@Security('api_key') 
export class OffScheduleController extends Controller {
    private crud: CrudBase<EpisodeCacheDefinition>;

    constructor() {
        super();
        this.crud = new CrudBase(offScheduleService);
    }

    @Get('/')
    public async getItems(): Promise<EpisodeCacheDefinition[]> {
        return this.crud.errorWrapper(this, {}, async () => {
            return this.crud.get();
        }, false);
    }

    @Put('/')
    public async updateItem(@Body() value: EpisodeCacheDefinition): Promise<EpisodeCacheDefinition | undefined> {
        return this.crud.errorWrapper(this, value, async () => {
            return this.crud.put(value);
        });
    }

    @Post('/')
    public async createItem(@Body() value: EpisodeCacheDefinition): Promise<EpisodeCacheDefinition | undefined> {
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

    @Post('/refresh')
    public refresh(@Body() def: EpisodeCacheDefinition) :  boolean {
        offScheduleService.recacheSeries(def);
        return true;
    }
}