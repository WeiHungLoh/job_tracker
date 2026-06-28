export const ALLOWED_ORIGINS = new Set([
    'https://jobtracker-whloh.netlify.app',
    'https://jobtracker.weihungloh.com',
    'https://weihungloh.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.74:3000',
]);

export const REQUEST_LIMIT = 400;
export const REQUEST_WINDOW_MS = 15 * 60 * 1000;
