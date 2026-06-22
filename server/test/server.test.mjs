import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../dist/server.js';
import { handleRouteError } from '../dist/http/responses.js';
import jwt from 'jsonwebtoken';

process.env.ACCESS_TOKEN_SECRET = 'test-only-secret';

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

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
});

test('returns 422 for an unsupported active application status filter', async () => {
    const token = jwt.sign({ id: 1, email: 'test@example.com' }, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications?jobStatus=Unknown`, {
        headers: { Cookie: `token=${token}` },
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'A supported job status or Show All is required.' });
});

test('returns 422 for an unsupported archived application status filter', async () => {
    const token = jwt.sign({ id: 1, email: 'test@example.com' }, process.env.ACCESS_TOKEN_SECRET);
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

test('returns 404 for an unknown route', async () => {
    const response = await fetch(`${baseUrl}/unknown`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Route not found.' });
});

test('returns 422 for an invalid protected route parameter', async () => {
    const token = jwt.sign({ id: 1, email: 'test@example.com' }, process.env.ACCESS_TOKEN_SECRET);
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
        for (let requestNumber = 0; requestNumber < 300; requestNumber += 1) {
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
