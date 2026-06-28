import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '../dist/config/auth.js';
import { createAccessToken, createRefreshToken } from '../dist/auth/tokens.js';
import { createApp } from '../dist/app.js';
import { handleRouteError } from '../dist/http/responses.js';
import jwt from 'jsonwebtoken';
import { REQUEST_LIMIT } from '../dist/config/server.js';

process.env.ACCESS_TOKEN_SECRET = 'test-only-secret';
process.env.REFRESH_TOKEN_SECRET = 'different-test-only-refresh-secret';

const TEST_USER = { id: 1, email: 'test@example.com' };

const getSetCookieHeader = (response) => {
    return response.headers.get('set-cookie') ?? '';
};

let baseUrl;
let server;

before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
});

test('returns 200 for the health endpoint', async () => {
    const response = await fetch(`${baseUrl}/ping`);

    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'testing');
});

test('returns 204 with no body when logging out', async () => {
    const response = await fetch(`${baseUrl}/authentication/sessions/current`, { method: 'DELETE' });
    const setCookieHeader = getSetCookieHeader(response);

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.match(setCookieHeader, /token=;/);
    assert.match(setCookieHeader, /refresh_token=;/);
    assert.match(setCookieHeader, /SameSite=Strict/);
});

test('creates access and refresh tokens with the configured expiration times', () => {
    const accessToken = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const refreshToken = createRefreshToken(TEST_USER, process.env.REFRESH_TOKEN_SECRET);
    const accessPayload = jwt.decode(accessToken);
    const refreshPayload = jwt.decode(refreshToken);

    assert.equal(accessPayload.exp - accessPayload.iat, 15 * 60);
    assert.equal(refreshPayload.exp - refreshPayload.iat, 3 * 24 * 60 * 60);
    assert.equal(ACCESS_TOKEN_COOKIE_OPTIONS.maxAge, 15 * 60 * 1000);
    assert.equal(REFRESH_TOKEN_COOKIE_OPTIONS.maxAge, 3 * 24 * 60 * 60 * 1000);
    assert.equal(ACCESS_TOKEN_COOKIE_OPTIONS.sameSite, 'strict');
    assert.equal(REFRESH_TOKEN_COOKIE_OPTIONS.sameSite, 'strict');
    assert.equal(REFRESH_TOKEN_COOKIE_OPTIONS.path, '/api/authentication');
});

test('refreshes an access token without requiring an access token', async () => {
    const refreshToken = createRefreshToken(TEST_USER, process.env.REFRESH_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/authentication/sessions/refresh`, {
        method: 'POST',
        headers: { Cookie: `refresh_token=${refreshToken}` },
    });
    const setCookieHeader = getSetCookieHeader(response);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: 'Access token refreshed.' });
    assert.match(setCookieHeader, /token=/);
    assert.match(setCookieHeader, /Max-Age=900/);
    assert.match(setCookieHeader, /HttpOnly/);
    assert.match(setCookieHeader, /SameSite=Strict/);
});

test('clears both cookies when the refresh token is missing', async () => {
    const response = await fetch(`${baseUrl}/authentication/sessions/refresh`, { method: 'POST' });
    const setCookieHeader = getSetCookieHeader(response);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'No refresh token found. Please sign in.' });
    assert.match(setCookieHeader, /token=;/);
    assert.match(setCookieHeader, /refresh_token=;/);
});

test('rejects an access token supplied as a refresh token', async () => {
    const accessToken = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/authentication/sessions/refresh`, {
        method: 'POST',
        headers: { Cookie: `refresh_token=${accessToken}` },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Invalid or expired refresh token. Please sign in.' });
});

test('the current session endpoint only accepts an access token', async () => {
    const refreshToken = createRefreshToken(TEST_USER, process.env.REFRESH_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/authentication/sessions/current`, {
        headers: { Cookie: `refresh_token=${refreshToken}` },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'No authentication token found. Please sign in.' });
});

test('returns 422 for an unsupported active application status filter', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications?jobStatus=Unknown`, {
        headers: { Cookie: `token=${token}` },
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'A supported job status or Show All is required.' });
});

test('returns 422 for an unsupported archived application status filter', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/archived-job-applications?jobStatus=Unknown`, {
        headers: { Cookie: `token=${token}` },
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'A supported job status or Show All is required.' });
});

test('returns 401 when a protected route has no token', async () => {
    const response = await fetch(`${baseUrl}/job-applications`);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'No authentication token found. Please sign in.' });
});

test('returns 401 and clears an expired access token', async () => {
    const token = jwt.sign({ ...TEST_USER, tokenType: 'access' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -1 });
    const response = await fetch(`${baseUrl}/job-applications`, {
        headers: { Cookie: `token=${token}` },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Invalid or expired token. Please sign in.' });
    assert.match(getSetCookieHeader(response), /token=;/);
});

test('returns 401 and clears both cookies for an expired refresh token', async () => {
    const token = jwt.sign({ ...TEST_USER, tokenType: 'refresh' }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: -1 });
    const response = await fetch(`${baseUrl}/authentication/sessions/refresh`, {
        method: 'POST',
        headers: { Cookie: `refresh_token=${token}` },
    });
    const setCookieHeader = getSetCookieHeader(response);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Invalid or expired refresh token. Please sign in.' });
    assert.match(setCookieHeader, /token=;/);
    assert.match(setCookieHeader, /refresh_token=;/);
});

test('returns 404 for an unknown route', async () => {
    const response = await fetch(`${baseUrl}/unknown`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Route not found.' });
});

test('returns 422 for an invalid protected route parameter', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications/not-a-number`, {
        method: 'DELETE',
        headers: { Cookie: `token=${token}` },
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'Job application ID must be a positive integer.' });
});

test('returns 503 when authentication configuration is unavailable', async () => {
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    delete process.env.ACCESS_TOKEN_SECRET;

    try {
        const response = await fetch(`${baseUrl}/authentication/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        });

        assert.equal(response.status, 503);
        assert.deepEqual(await response.json(), { message: 'Authentication is temporarily unavailable.' });
    } finally {
        process.env.ACCESS_TOKEN_SECRET = accessTokenSecret;
    }
});

test('logs error details and returns a generic 500 response', () => {
    const responses = [];
    const res = {
        status(status) {
            responses.push({ status });
            return this;
        },
        send(body) {
            responses.at(-1).body = body;
            return this;
        },
    };
    const originalConsoleError = console.error;
    console.error = () => undefined;

    try {
        handleRouteError(res, Object.assign(new Error('duplicate detail'), { code: '23505' }), 'Unable to save.');
        handleRouteError(res, new Error('private database detail'), 'Unable to save.');
    } finally {
        console.error = originalConsoleError;
    }

    assert.deepEqual(responses, [
        { status: 500, body: { message: 'Unable to save.' } },
        { status: 500, body: { message: 'Unable to save.' } },
    ]);
});

test('returns 429 after the request limit is exceeded', async () => {
    const limitedServer = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        limitedServer.once('listening', resolve);
        limitedServer.once('error', reject);
    });
    const address = limitedServer.address();
    const limitedBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
        for (let requestNumber = 0; requestNumber < REQUEST_LIMIT; requestNumber += 1) {
            const response = await fetch(`${limitedBaseUrl}/ping`);
            assert.equal(response.status, 200);
        }
        const response = await fetch(`${limitedBaseUrl}/ping`);
        assert.equal(response.status, 429);
        assert.deepEqual(await response.json(), { message: 'Too many requests. Please try again later.' });
    } finally {
        await new Promise((resolve, reject) => {
            limitedServer.close((error) => (error ? reject(error) : resolve()));
        });
    }
});
