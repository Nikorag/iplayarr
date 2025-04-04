import { Controller } from 'tsoa';

import AbstractEntityService from '../../service/AbstractEntityService';
import { Entity } from '../../types/models/Entity';
import { ApiError, ApiResponse } from '../../types/responses/ApiResponse';
import { Validator } from '../../validators/Validator';

export default class CrudBase<T extends Entity> {
    service: AbstractEntityService<string, T>
    validator?: Validator

    constructor(service: AbstractEntityService<string, T>, validator?: Validator) {
        this.service = service;
        this.validator = validator;
    }

    async get(): Promise<T[]> {
        return await this.service.all();
    }

    async put(value: T): Promise<T | undefined> {
        return await this.service.updateItem(value.id, value);
    }

    async post(value: T): Promise<T | undefined> {
        return await this.service.setItem(value.id, value);
    }

    async delete(id: string): Promise<boolean> {
        await this.service.removeItem(id);
        return true;
    }

    async errorWrapper(controller : Controller, body : any, callback: () => Promise<any>, validate : boolean = true) : Promise<any> {
        if (validate && this.validator) {
            const validationResult: { [key: string]: string } = await this.validator.validate(body);
            if (Object.keys(validationResult).length > 0) {
                const apiResponse: ApiResponse = {
                    error: ApiError.INVALID_INPUT,
                    invalid_fields: validationResult,
                };
                controller.setStatus(400);
                return Promise.reject(apiResponse);
            }
        }
    
        try {
            return await callback();
        } catch (err: any) {
            const errorResponse: ApiResponse = err.api_response ?? {
                error: ApiError.INVALID_INPUT,
                message: err?.message,
            };
            controller.setStatus(500);
            return Promise.reject(errorResponse);
        }
    }
}