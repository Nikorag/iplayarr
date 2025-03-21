import AbstractStorageService from '../../service/abstractStorageService';
import { AbstractStoredType } from '../../types/models/AbstractStoredType';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { Validator } from '../../validators/Validator';
import { AbstractExposedRoute } from './AbstractExposedRoute';

export class AbstractStorageRoute<T extends AbstractStoredType> extends AbstractExposedRoute<T> {
    service : AbstractStorageService<T>;

    constructor(service : AbstractStorageService<T>, validator? : Validator){
        super(validator);
        this.service = service;
    }

    async getAll() : Promise<T[] | ApiResponse> {
        return this.service.all();
    }

    async create(t : T) : Promise<T | ApiResponse> {
        return this.service.setItem(t.id, t);
    }

    async update(form : Partial<T>) : Promise<T | ApiResponse> {
        const response : T | undefined = await this.service.updateItem(form.id, form);
        if (response){
            return response;
        } else {
            return {
                error : ApiError.INVALID_INPUT
            } as ApiResponse
        }
    }

    async delete(id : string) : Promise<void> {
        return this.service.removeItem(id);
    }
}