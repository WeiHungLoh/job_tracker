export type SignInRequest = {
    email: string;
    password: string;
};

export type SignInResponse = {
    message: string;
};

export type SignUpRequest = {
    email: string;
    password: string;
};

export type SignUpResponse = string;

export type VerifyAuthenticationRequest = null;
export type VerifyAuthenticationResponse = {
    message: string;
};

export type LogoutRequest = null;
export type LogoutResponse = null;
