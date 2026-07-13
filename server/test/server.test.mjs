import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '../dist/config/auth.js';
import { createAccessToken, createRefreshToken } from '../dist/auth/tokens.js';
import { createApp } from '../dist/app.js';
import { pool } from '../dist/db/connectDB.js';
import { handleRouteError } from '../dist/http/responses.js';
import jwt from 'jsonwebtoken';
import { AUTH_EMAIL_IP_LIMIT, REQUEST_LIMIT } from '../dist/config/server.js';
import {
    FIELD_MAX_LENGTHS,
    PASSWORD_MAX_BYTES,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
} from '../dist/config/validation.js';
import {
    getPasswordValidationError,
    isApplicationViewMode,
    isValidDate,
    isValidHttpURL,
    normalizeEmail,
    toJobStatusQueryValues,
    toTrimmedString,
} from '../dist/http/validation.js';

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

test('returns security headers without identifying Express', async () => {
    const response = await fetch(`${baseUrl}/unknown-route`);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
});

test('creates new user preference rows with enabled display defaults', async () => {
    const createTablesSource = await readFile(new URL('../src/db/queries/createTables.ts', import.meta.url), 'utf8');
    const userPreferencesTable = createTablesSource.match(
        /CREATE TABLE IF NOT EXISTS user_preferences \([\s\S]*?\n\s*\)`/
    )?.[0];

    assert.ok(userPreferencesTable);
    assert.match(userPreferencesTable, /application_show_notes BOOLEAN NOT NULL DEFAULT true/);
    assert.match(userPreferencesTable, /application_show_archive BOOLEAN NOT NULL DEFAULT true/);
    assert.match(userPreferencesTable, /application_enable_scroll BOOLEAN NOT NULL DEFAULT true/);
    assert.match(userPreferencesTable, /archived_application_show_notes BOOLEAN NOT NULL DEFAULT true/);
    assert.match(userPreferencesTable, /interview_view_mode TEXT NOT NULL DEFAULT 'list'/);
    assert.match(userPreferencesTable, /archived_interview_view_mode TEXT NOT NULL DEFAULT 'list'/);
    assert.match(userPreferencesTable, /user_preferences_interview_view_mode_check/);
    assert.match(userPreferencesTable, /user_preferences_archived_interview_view_mode_check/);
});

test('adds interview view preferences to existing user preference tables idempotently', async () => {
    const createTablesSource = await readFile(new URL('../src/db/queries/createTables.ts', import.meta.url), 'utf8');

    assert.match(createTablesSource, /ADD COLUMN IF NOT EXISTS interview_view_mode TEXT DEFAULT 'list'/);
    assert.match(createTablesSource, /ADD COLUMN IF NOT EXISTS archived_interview_view_mode TEXT DEFAULT 'list'/);
    assert.match(createTablesSource, /interview_view_mode = COALESCE\(interview_view_mode, 'list'\)/);
    assert.match(createTablesSource, /ALTER COLUMN interview_view_mode SET NOT NULL/);
    assert.match(createTablesSource, /ALTER COLUMN archived_interview_view_mode SET NOT NULL/);
    assert.match(createTablesSource, /SELECT 1 FROM pg_constraint/);
});

test('returns 204 with no body when logging out', async () => {
    const response = await fetch(`${baseUrl}/authentication/sessions/current`, { method: 'DELETE' });
    const setCookieHeader = getSetCookieHeader(response);

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.match(setCookieHeader, /access_token=;/);
    assert.match(setCookieHeader, /refresh_token=;/);
    assert.match(setCookieHeader, /access_token=; Path=\/api;/);
    assert.match(setCookieHeader, /refresh_token=; Path=\/api\/authentication;/);
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
    assert.equal(ACCESS_TOKEN_COOKIE_OPTIONS.path, '/api');
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
    assert.match(setCookieHeader, /access_token=/);
    assert.match(setCookieHeader, /Max-Age=900/);
    assert.match(setCookieHeader, /HttpOnly/);
    assert.match(setCookieHeader, /SameSite=Strict/);
});

test('clears both cookies when the refresh token is missing', async () => {
    const response = await fetch(`${baseUrl}/authentication/sessions/refresh`, { method: 'POST' });
    const setCookieHeader = getSetCookieHeader(response);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'No refresh token found. Please sign in.' });
    assert.match(setCookieHeader, /access_token=;/);
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
    const response = await fetch(`${baseUrl}/job-applications?jobStatuses=Unknown`, {
        headers: { Cookie: `access_token=${token}` },
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'Each job status filter must be supported.' });
});

test('returns 422 for an unsupported archived application status filter', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/archived-job-applications?jobStatuses=Unknown`, {
        headers: { Cookie: `access_token=${token}` },
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'Each job status filter must be supported.' });
});

test('parses repeated job status query parameters', () => {
    assert.deepEqual(toJobStatusQueryValues(['Accepted', 'Offer']), ['Accepted', 'Offer']);
    assert.deepEqual(toJobStatusQueryValues(''), [
        'Accepted',
        'Applied',
        'Declined',
        'Ghosted',
        'Interview',
        'Offer',
        'Rejected',
    ]);
    assert.equal(toJobStatusQueryValues(['Accepted', 'Unknown']), undefined);
});

test('validates application view mode values', () => {
    assert.equal(isApplicationViewMode('list'), true);
    assert.equal(isApplicationViewMode('board'), true);
    assert.equal(isApplicationViewMode('calendar'), false);
    assert.equal(isApplicationViewMode(undefined), false);
});

test('returns 422 for unsupported user preference view modes', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/user-preferences`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({ application_view_mode: 'calendar' }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'View mode preferences must be list or board.' });
});

test('returns 422 for unsupported interview view modes', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/user-preferences`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({ archived_interview_view_mode: 'calendar' }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'View mode preferences must be list or board.' });
});

test('returns 422 for unsupported application list sort preferences', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/user-preferences`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({ application_list_sort_order: 'recent' }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Application list sort order preference must use a supported value.',
    });
});

test('does not allow the list-only job status order for application boards', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/user-preferences`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({ archived_application_board_sort_order: 'job_status' }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Archived application board sort order preference must use a supported value.',
    });
});

test('saves a supported application sort preference and returns the complete preference row', async () => {
    const originalQuery = pool.query;
    const storedPreferences = {
        application_job_statuses: ['Applied'],
        application_show_notes: true,
        application_show_archive: true,
        application_enable_scroll: true,
        application_view_mode: 'list',
        application_list_sort_order: 'job_status',
        application_board_sort_order: 'application_date_desc',
        archived_application_job_statuses: ['Offer'],
        archived_application_show_notes: false,
        archived_application_view_mode: 'board',
        archived_application_list_sort_order: 'job_status',
        archived_application_board_sort_order: 'company_name_desc',
        interview_view_mode: 'list',
        archived_interview_view_mode: 'board',
    };
    let queryValues;
    pool.query = async (_sql, values) => {
        queryValues = values;
        return { rows: [storedPreferences] };
    };

    try {
        const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
        const response = await fetch(`${baseUrl}/user-preferences`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `access_token=${token}`,
            },
            body: JSON.stringify({ archived_application_board_sort_order: 'company_name_desc' }),
        });

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), storedPreferences);
        assert.equal(queryValues.length, 15);
        assert.equal(queryValues[0], TEST_USER.id);
        assert.equal(queryValues[12], 'company_name_desc');
    } finally {
        pool.query = originalQuery;
    }
});

test('returns 401 when a protected route has no token', async () => {
    const response = await fetch(`${baseUrl}/job-applications`);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'No authentication token found. Please sign in.' });
});

test('returns 401 and clears an expired access token', async () => {
    const token = jwt.sign({ ...TEST_USER, tokenType: 'access' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -1 });
    const response = await fetch(`${baseUrl}/job-applications`, {
        headers: { Cookie: `access_token=${token}` },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Invalid or expired token. Please sign in.' });
    assert.match(getSetCookieHeader(response), /access_token=;/);
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
    assert.match(setCookieHeader, /access_token=;/);
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
        headers: { Cookie: `access_token=${token}` },
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'Job application ID must be a positive integer.' });
});

test('requires a job status in the atomic status update', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications/1/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({}),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'A supported job status is required.',
    });
});

test('returns 409 when moving an application with an active interview to Applied', async () => {
    const originalQuery = pool.query;
    let query;
    pool.query = async (sql, values) => {
        query = { sql: String(sql), values };
        return {
            rows: [{ application_exists: true, application_updated: false }],
        };
    };

    try {
        const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
        const response = await fetch(`${baseUrl}/job-applications/1/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `access_token=${token}`,
            },
            body: JSON.stringify({ jobStatus: 'Applied' }),
        });

        assert.equal(response.status, 409);
        assert.deepEqual(await response.json(), {
            message: 'A job application with an active interview cannot be moved to Applied.',
        });
        assert.deepEqual(query.values, ['Applied', 1, TEST_USER.id]);
        assert.match(query.sql, /\$1::text <> 'Applied'/);
        assert.match(query.sql, /job_applications\.job_status = 'Applied'/);
        assert.match(query.sql, /interviews\.is_archived = false/);
        assert.doesNotMatch(query.sql, /edit_status/);
    } finally {
        pool.query = originalQuery;
    }
});

test('updates an application status when there is no active interview conflict', async () => {
    const originalQuery = pool.query;
    pool.query = async () => ({
        rows: [{ application_exists: true, application_updated: true }],
    });

    try {
        const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
        const response = await fetch(`${baseUrl}/job-applications/1/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `access_token=${token}`,
            },
            body: JSON.stringify({ jobStatus: 'Interview' }),
        });

        assert.equal(response.status, 204);
    } finally {
        pool.query = originalQuery;
    }
});

test('rejects future application dates before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            companyName: 'Example',
            jobTitle: 'Engineer',
            appDate: '2999-12-31T23:59:00.000Z',
            jobStatus: 'Applied',
            jobLocation: '',
            jobURL: '',
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Application date cannot be later than the current date.',
    });
});

test('rejects impossible application dates before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            companyName: 'Example',
            jobTitle: 'Engineer',
            appDate: '2025-02-30T10:00:00.000Z',
            jobStatus: 'Applied',
            jobLocation: '',
            jobURL: '',
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Job application fields are missing, invalid, or too long.',
    });
});

test('rejects application dates with an invalid hour before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            companyName: 'Example',
            jobTitle: 'Engineer',
            appDate: '2025-01-01T24:00:00.000Z',
            jobStatus: 'Applied',
            jobLocation: '',
            jobURL: '',
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Job application fields are missing, invalid, or too long.',
    });
});

test('rejects impossible interview dates before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-interviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            jobId: 1,
            interviewDate: '2025-04-31T10:00:00.000Z',
            interviewLocation: 'Remote',
            interviewType: '',
            notes: '',
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Interview fields are missing, invalid, or too long.',
    });
});

test('rejects interview dates with an invalid hour before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-interviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            jobId: 1,
            interviewDate: '2025-01-01T24:00:00.000Z',
            interviewLocation: 'Remote',
            interviewType: '',
            notes: '',
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Interview fields are missing, invalid, or too long.',
    });
});

test('rejects non-http application URLs before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            companyName: 'Example',
            jobTitle: 'Engineer',
            appDate: '2025-01-01T00:00:00.000Z',
            jobStatus: 'Applied',
            jobLocation: '',
            jobURL: 'javascript:alert(1)',
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'URL must be in a valid format.',
    });
});

test('rejects application fields over their maximum length before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            companyName: 'x'.repeat(FIELD_MAX_LENGTHS.companyName + 1),
            jobTitle: 'Engineer',
            appDate: '2025-01-01T00:00:00.000Z',
            jobStatus: 'Applied',
            jobLocation: '',
            jobURL: '',
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Job application fields are missing, invalid, or too long.',
    });
});

test('rejects interview fields over their maximum length before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-interviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            jobId: 1,
            interviewDate: '2025-01-02T00:00:00.000Z',
            interviewLocation: 'Remote',
            interviewType: '',
            notes: 'x'.repeat(FIELD_MAX_LENGTHS.notes + 1),
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: 'Interview fields are missing, invalid, or too long.',
    });
});

test('rejects application notes over their maximum length before accessing the database', async () => {
    const token = createAccessToken(TEST_USER, process.env.ACCESS_TOKEN_SECRET);
    const response = await fetch(`${baseUrl}/job-applications/1/notes`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `access_token=${token}`,
        },
        body: JSON.stringify({
            notes: 'x'.repeat(FIELD_MAX_LENGTHS.notes + 1),
        }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
        message: `Notes must be ${FIELD_MAX_LENGTHS.notes} characters or fewer.`,
    });
});

test('validates and trims shared text and URL inputs', () => {
    assert.equal(toTrimmedString('  Example  ', 20), 'Example');
    assert.equal(toTrimmedString('   ', 20), undefined);
    assert.equal(toTrimmedString('   ', 20, true), '');
    assert.equal(toTrimmedString('too long', 3), undefined);
    assert.equal(isValidHttpURL('https://example.com/jobs/1'), true);
    assert.equal(isValidHttpURL('https://careers.example.co.uk/jobs/1'), true);
    assert.equal(isValidHttpURL('http://localhost:3000/jobs/1'), false);
    assert.equal(isValidHttpURL('https://example/jobs/1'), false);
    assert.equal(isValidHttpURL('ftp://example.com/file'), false);
    assert.equal(isValidHttpURL('javascript:alert(1)'), false);
});

test('normalizes email and validates the password policy', () => {
    assert.equal(normalizeEmail('  User@Example.COM  '), 'user@example.com');
    assert.equal(normalizeEmail(null), undefined);
    assert.equal(
        getPasswordValidationError('x'.repeat(PASSWORD_MIN_LENGTH - 1)),
        'Password must be at least 15 characters.'
    );
    assert.equal(getPasswordValidationError('x'.repeat(PASSWORD_MIN_LENGTH)), undefined);
    assert.equal(
        getPasswordValidationError('x'.repeat(PASSWORD_MAX_LENGTH + 1)),
        'Password must be 64 characters or fewer.'
    );
    assert.equal(
        getPasswordValidationError('😀'.repeat(Math.floor(PASSWORD_MAX_BYTES / 4) + 1)),
        'Password is too long when encoded. Use fewer Unicode characters.'
    );
});

test('rejects a short sign-up password before accessing the database', async () => {
    const response = await fetch(`${baseUrl}/authentication/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new-user@example.com', password: 'short' }),
    });

    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), { message: 'Password must be at least 15 characters.' });
});

test('validates calendar dates strictly', () => {
    assert.equal(isValidDate('2024-02-29T10:00:00.000Z'), true);
    assert.equal(isValidDate('2025-02-29T10:00:00.000Z'), false);
    assert.equal(isValidDate('2025-02-30T10:00:00.000Z'), false);
    assert.equal(isValidDate('2025-04-31T10:00:00.000Z'), false);
    assert.equal(isValidDate('2025-04-30T10:00:00.000Z'), true);
    assert.equal(isValidDate('2025-01-01T23:59:59.999Z'), true);
    assert.equal(isValidDate('2025-01-01T24:00:00.000Z'), false);
    assert.equal(isValidDate('2025-01-01T23:60:00.000Z'), false);
    assert.equal(isValidDate('2025-01-01T23:59:60.000Z'), false);
    assert.equal(isValidDate('20300-03-30T00:00:00.000Z'), false);
    assert.equal(isValidDate('+020300-03-30T00:00:00.000Z'), false);
    assert.equal(isValidDate('9999-12-31T23:59:59.999Z'), true);
});

test('returns the generic authentication error for invalid credentials', async () => {
    const response = await fetch(`${baseUrl}/authentication/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'password' }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Invalid email or password.' });
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

test('rate limits repeated authentication attempts by IP and email', async () => {
    const limitedEmail = 'rate-limit-test';

    for (let requestNumber = 0; requestNumber < AUTH_EMAIL_IP_LIMIT; requestNumber += 1) {
        const response = await fetch(`${baseUrl}/authentication/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: limitedEmail, password: 'password' }),
        });
        assert.equal(response.status, 401);
    }

    const response = await fetch(`${baseUrl}/authentication/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: limitedEmail, password: 'password' }),
    });
    assert.equal(response.status, 429);
    assert.deepEqual(await response.json(), {
        message: 'Too many authentication attempts. Please try again later.',
    });
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
            const response = await fetch(`${limitedBaseUrl}/unknown-route`);
            assert.equal(response.status, 404);
        }
        const response = await fetch(`${limitedBaseUrl}/unknown-route`);
        assert.equal(response.status, 429);
        assert.deepEqual(await response.json(), { message: 'Too many requests. Please try again later.' });
    } finally {
        await new Promise((resolve, reject) => {
            limitedServer.close((error) => (error ? reject(error) : resolve()));
        });
    }
});
