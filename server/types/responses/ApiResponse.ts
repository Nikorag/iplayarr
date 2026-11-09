export enum ApiError {
    API_NOT_FOUND = 'API Not Found',
    NOT_AUTHORISED = 'Not Authorised',
    INVALID_INPUT = 'Invalid Input',
    INTERNAL_ERROR = 'Internal Error',
    INVALID_CREDENTIALS = 'Invalid Credentials',
    OIDC_NOT_ENABLED = 'OIDC Not Enabled',
}

export interface ApiResponse {
    error?: ApiError;
    invalid_fields?: {
        [key: string]: string;
    };
    message?: string;
}
