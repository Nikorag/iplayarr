import { Body, Controller, Delete,Get, Path, Post, Put, Route, Security, Tags } from 'tsoa';

import historyService from '../../service/historyService';
import queueService from '../../service/queueService';
import socketService from '../../service/socketService';
import { QueueEntry } from '../../types/models/QueueEntry';
import CrudBase from './CrudBase';

@Route('json-api/queue/history')
@Tags('History')
@Security('api_key') 
export class HistoryController extends Controller {
    private crud: CrudBase<QueueEntry>;

    constructor() {
        super();
        this.crud = new CrudBase(historyService);
    }

    @Get('/')
    public async getItems(): Promise<QueueEntry[]> {
        return this.crud.errorWrapper(this, {}, async () => {
            return this.crud.get();
        }, false);
    }

    @Put('/')
    public async updateItem(@Body() value: QueueEntry): Promise<QueueEntry | undefined> {
        return this.crud.errorWrapper(this, value, async () => {
            return this.crud.put(value);
        });
    }

    @Post('/')
    public async createItem(@Body() value: QueueEntry): Promise<QueueEntry | undefined> {
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
}

@Route('json-api/queue/queue')
@Tags('History')
@Security('api_key') 
export class QueueController extends Controller {
    @Get('/')
    public getItems(): QueueEntry[] {
        return queueService.getQueue() || [];
    }

    @Delete('/{id}')
    public deleteItem(@Path('id') id: string): QueueEntry[] {
        queueService.cancelItem(id);
        const queue : QueueEntry[] = queueService.getQueue() || [];
        socketService.emit('queue', queue);
        return queue;
    }
}