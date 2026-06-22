import type { ErrorResponse } from '../../http/models.js';
export type { EmptyResponse } from '../../http/models.js';

export type CredentialsRequest = {
    email: string;
    password: string;
};

export type MessageResponse = {
    message: string;
};

export type AuthenticationResponse = MessageResponse | ErrorResponse;
export type SignUpResponse = string | ErrorResponse;
