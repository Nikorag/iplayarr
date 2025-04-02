import { Request, Response, Router } from 'express';

import AbstractStorageService from '../../service/AbstractStorageService';
import { Entity } from '../../types/models/Entity';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';

class CrudRoute<T extends Entity> {
    router: Router
    service: AbstractStorageService<T>

    constructor(service: AbstractStorageService<T>) {
        this.router = Router();
        this.service = service;

        this.router.get('/', async (_, res: Response) => {
            errorWrapper(res, async () => {
                const response = await this.get();
                res.json(response);
            });
        });

        this.router.put('/', async (req: Request, res: Response) => {
            errorWrapper(res, async () => {
                const value: T = req.body as any as T;
                const response = await this.put(value);
                res.json(response);
            });
        });

        this.router.post('/', async (req: Request, res: Response) => {
            errorWrapper(res, async () => {
                const value: T = req.body as any as T;
                const response = await this.post(value);
                res.json(response);
            });
        });

        this.router.delete('/', async (req: Request, res: Response) => {
            errorWrapper(res, async () => {
                const { id } = req.body;
                const response = await this.delete(id);
                res.json(response);
            });
        });
    }

    async get() : Promise<T[]> {
        return await this.service.all();
    }

    async put(value : T) : Promise<T | undefined> {
        return await this.service.updateItem(value.id, value);
    }

    async post(value : T) : Promise<T | undefined> {
        return await this.service.setItem(value.id, value);
    }

    async delete(id : string) : Promise<boolean> {
        await this.service.removeItem(id);
        return true;
    }
}

async function errorWrapper(res: Response, callback: () => Promise<void>) {
    try {
        await callback();
    } catch (err: any) {
        const errorResponse: ApiResponse = err.api_response ?? {
            error: ApiError.INVALID_INPUT,
            message: err?.message
        }
        res.status(500).send(errorResponse)
    }
}

export default CrudRoute;