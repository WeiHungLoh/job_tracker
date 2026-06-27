export const FieldType = {
    formData: 'formData',
    path: 'path',
    query: 'query',
} as const;

export type FieldType = (typeof FieldType)[keyof typeof FieldType];

export type EndpointConfigEntry = {
    url: string;
    verb: 'DELETE' | 'GET' | 'PATCH' | 'POST';
    fieldMap?: Record<string, FieldType>;
};

export type APIRequest = Record<string, unknown> | null;

export type WakeRequest = null;
export type WakeResponse = string;

export class JobTrackerAPIError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'JobTrackerAPIError';
        this.status = status;
    }
}
