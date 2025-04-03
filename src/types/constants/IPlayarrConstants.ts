import { ApiError, ApiResponse } from '../responses/ApiResponse';

export default {
    NotImplementedError : {
        error : ApiError.INTERNAL_ERROR,
        message : 'Method not implenented'
    } as ApiResponse
}