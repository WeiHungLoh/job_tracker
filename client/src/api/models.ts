export type FieldType = 'formData' | 'path' | 'query';

export type EndpointConfigEntry = {
    url: string;
    verb: 'DELETE' | 'GET' | 'PATCH' | 'POST';
    fieldMap?: Record<string, FieldType>;
};

export type APIRequest = Record<string, unknown> | null;

export class JobTrackerAPIError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'JobTrackerAPIError';
        this.status = status;
    }
}
