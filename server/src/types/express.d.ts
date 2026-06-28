import type { AuthenticatedUser } from '../auth/models.js';

declare global {
    namespace Express {
        interface Request {
            user: AuthenticatedUser;
        }
    }
}

export {};
