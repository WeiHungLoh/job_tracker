export type ErrorResponse = {
    message: string;
};

export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500 | 503;

export type EmptyResponse = undefined | ErrorResponse;
