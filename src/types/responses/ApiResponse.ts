export enum ApiError {
    API_NOT_FOUND = "API Not Found",
    NOT_AUTHORISED = "Not Authorised",
    INVALID_INPUT = "Invalid Input",
    INTERNAL_ERROR = "Internal Error"
}

export interface ApiResponse {
    error?: ApiError;
    invalid_fields?: {
        [key : string] : string
    },
    message? : string
}