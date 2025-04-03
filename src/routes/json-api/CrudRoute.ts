import { Request, Response, Router } from 'express';

import AbstractStorageService from '../../service/AbstractStorageService';
import { Entity } from '../../types/models/Entity';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { Validator } from '../../validators/Validator';

class CrudRoute<T extends Entity> {
    router: Router
    service: AbstractStorageService<T>

    constructor(service: AbstractStorageService<T>, validator? : Validator) {
        this.router = Router();
        this.service = service;

        this.router.get('/', async (req : Request, res: Response) => {
            errorWrapper(req, res, undefined, async () => {
                const response = await this.get();
                res.json(response);
            });
        });

        this.router.put('/', async (req: Request, res: Response) => {
            errorWrapper(req, res, validator, async () => {
                const value: T = req.body as any as T;
                const response = await this.put(value);
                res.json(response);
            });
        });

        this.router.post('/', async (req: Request, res: Response) => {
            errorWrapper(req, res, validator, async () => {
                const value: T = req.body as any as T;
                const response = await this.post(value);
                res.json(response);
            });
        });

        this.router.delete('/', async (req: Request, res: Response) => {
            errorWrapper(req, res, undefined, async () => {
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

async function errorWrapper(req : Request, res: Response, validator : Validator | undefined, callback: () => Promise<void>) {
    if (validator){
        const validationResult : {[key:string] : string} = await validator.validate(req.body);
        if (Object.keys(validationResult).length > 0){
            const apiResponse : ApiResponse = {
                error : ApiError.INVALID_INPUT,
                invalid_fields : validationResult
            }
            res.status(400).json(apiResponse);
            return;
        }
    }
    
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