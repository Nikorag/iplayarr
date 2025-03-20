import { Router } from 'express';

import queueService from '../../service/queueService';
import { QueueEntry } from '../../shared/types/models/QueueEntry';
import { ApiError, ApiResponse } from '../../shared/types/responses/ApiResponse';
import { AbstractExposedRoute } from './AbstractExposedRoute';

const router : Router = new (class extends AbstractExposedRoute<QueueEntry> {
    async getAll(): Promise<QueueEntry[] | ApiResponse> {
        return await queueService.all();
    }
    async create(t: QueueEntry): Promise<QueueEntry | ApiResponse> {
        return await queueService.setItem(t.pid, t);
    }
    async update(t: Partial<QueueEntry>): Promise<QueueEntry | ApiResponse> {
        const response : QueueEntry | undefined = await queueService.updateItem(t.pid as string, t);
        return response ?? {error: ApiError.INVALID_INPUT};
    }
    async delete(pid: string): Promise<void> {
        await queueService.cancelItem(pid);
    }
})().getRouter();


export default router;