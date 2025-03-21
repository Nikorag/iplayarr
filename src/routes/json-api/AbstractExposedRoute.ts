import {Request, Response, Router} from 'express';

import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { Validator } from '../../validators/Validator';

export abstract class AbstractExposedRoute<T> {
    router : Router = Router();

    constructor(validator? : Validator){
        this.router.get('/', async (_, res : Response) => {
            const all : T[] | ApiResponse = await this.getAll();
            res.json(all);
        });
        this.router.post('/', async (req : Request, res : Response) => {
            const form : T = req.body as any as T;
            const validatorResult = validator ? await validator.validate(form) : {};
            if (Object.keys(validatorResult).length > 0){
                const apiResponse : ApiResponse = {
                    error : ApiError.INVALID_INPUT,
                    invalid_fields : validatorResult
                }
                res.status(400).json(apiResponse);
                return;
            }
            const result : T | ApiResponse = await this.create(form);
            res.json(result);
        });
        this.router.put('/', async (req : Request, res : Response) => {
            const form : Partial<T> = req.body as any as T;
            const validatorResult = validator ? await validator.validate(form) : {};
            if (Object.keys(validatorResult).length > 0){
                const apiResponse : ApiResponse = {
                    error : ApiError.INVALID_INPUT,
                    invalid_fields : validatorResult
                }
                res.status(400).json(apiResponse);
                return;
            }
            const result : T | ApiResponse = await this.update(form);
            res.json(result);
        });
        this.router.delete('/', async (req : Request, res : Response) => {
            const {id} = req.body;
            await this.delete(id);
            res.json(true);
        });
    }

    abstract getAll() : Promise<T[] | ApiResponse>;
    abstract create(t : T) : Promise<T | ApiResponse>;
    abstract update(form : Partial<T>) : Promise<T | ApiResponse>;
    abstract delete(id : string) : Promise<void>;

    getRouter() : Router {
        return this.router;
    }
}