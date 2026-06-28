export type AuthenticatedUser = {
    id: number;
    email: string;
};

export type AuthenticationSecrets = {
    accessTokenSecret: string;
    refreshTokenSecret: string;
};
