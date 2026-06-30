const PRODUCTION_ORIGINS = [
    'https://jobtracker-whloh.netlify.app',
    'https://jobtracker.weihungloh.com',
    'https://weihungloh.com',
] as const;

const DEVELOPMENT_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.74:3000',
] as const;

export const ALLOWED_ORIGINS = new Set<string>(
    process.env.NODE_ENV === 'production' ? PRODUCTION_ORIGINS : [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS]
);

export const REQUEST_LIMIT = 400;
export const REQUEST_WINDOW_MS = 15 * 60 * 1000;

export const AUTH_EMAIL_IP_LIMIT = 10;
export const AUTH_IP_LIMIT = 50;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
