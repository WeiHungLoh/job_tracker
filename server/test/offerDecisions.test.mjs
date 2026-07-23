import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import * as validationConfig from '../dist/config/validation.js';
import * as httpValidation from '../dist/http/validation.js';
import { pool } from '../dist/db/connectDB.js';
import * as offerDecisionQueries from '../dist/db/queries/offerDecisions.js';
import offerDecisionRouter from '../dist/routes/offerDecision/index.js';

const compactSQL = (sql) => sql.replace(/\s+/g, ' ').trim();

const validValues = {
    career_growth: 3,
    company_culture_fit: 3,
    work_life_balance: 3,
    compensation: 3,
};

const validDetails = {
    currency: 'SGD',
    monthly_base_salary: 10000,
    bonus: '15% target',
    annual_leave_days: 21,
    work_arrangement: 'Hybrid',
    decision_deadline: '2026-07-18T10:00:00.000Z',
    pros: 'Strong product ownership',
    concerns: 'Two office days each week',
};

const validRequest = { ratings: validValues, details: validDetails };
const activeFilters = ['Offers to Evaluate', 'Evaluated Offers', 'Expired Evaluated Offers', 'Previous Evaluations'];
const archivedFilters = ['Evaluated Offers', 'Expired Evaluated Offers', 'Previous Evaluations'];

const withMockedPoolQuery = async (query, operation) => {
    const originalQuery = pool.query;
    pool.query = query;

    try {
        return await operation();
    } finally {
        pool.query = originalQuery;
    }
};

const withMockedPoolClient = async (query, operation) => {
    const originalConnect = pool.connect;
    let released = false;
    pool.connect = async () => ({
        query,
        release: () => {
            released = true;
        },
    });

    try {
        return await operation(() => released);
    } finally {
        pool.connect = originalConnect;
    }
};

const createResponse = () => ({
    statusCode: undefined,
    body: undefined,
    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    },
    send(body) {
        this.body = body;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
    sendStatus(statusCode) {
        this.statusCode = statusCode;
        return this;
    },
});

const getRouteHandler = (method, path) => {
    const layer = offerDecisionRouter.stack.find(
        (candidate) => candidate.route?.path === path && candidate.route.methods[method]
    );
    return layer?.route.stack.at(-1)?.handle;
};

test('declares shared offer evaluation limits without an equity limit', () => {
    assert.equal(validationConfig.OFFER_DECISION_VALUE_MIN, 1);
    assert.equal(validationConfig.OFFER_DECISION_VALUE_MAX, 5);
    assert.equal(validationConfig.OFFER_MONTHLY_BASE_SALARY_MAX, 1_000_000_000);
    assert.equal(validationConfig.OFFER_ANNUAL_LEAVE_DAYS_MAX, 365);
    assert.deepEqual(validationConfig.OFFER_DETAILS_MAX_LENGTHS, { bonus: 200, notes: 1000 });
});

test('declares the constrained offer evaluation table after job applications without repair SQL', async () => {
    const source = await readFile(new URL('../src/db/queries/createTables.ts', import.meta.url), 'utf8');
    const table = source.match(/CREATE TABLE IF NOT EXISTS offer_evaluations \([\s\S]*?\n\s*\)`/)?.[0];
    const setupQueries = source.match(/const setupQueries = \[[\s\S]*?\n\s*\];/)?.[0];

    assert.ok(table);
    assert.ok(setupQueries);
    assert.match(table, /job_id INTEGER NOT NULL/);
    assert.match(table, /user_id INTEGER NOT NULL/);
    assert.match(table, /career_growth_rating INTEGER NOT NULL/);
    assert.match(table, /company_culture_fit_rating INTEGER NOT NULL/);
    assert.match(table, /work_life_balance_rating INTEGER NOT NULL/);
    assert.match(table, /compensation_rating INTEGER NOT NULL/);
    assert.match(table, /BETWEEN \$\{OFFER_DECISION_VALUE_MIN\} AND \$\{OFFER_DECISION_VALUE_MAX\}/);
    assert.match(table, /currency TEXT NOT NULL/);
    assert.match(table, /currency ~ '\^\[A-Z\]\{3\}\$'/);
    assert.match(table, /monthly_base_salary INTEGER NOT NULL/);
    assert.match(table, /BETWEEN 0 AND \$\{OFFER_MONTHLY_BASE_SALARY_MAX\}/);
    assert.match(table, /bonus TEXT NOT NULL DEFAULT ''/);
    assert.match(table, /CHAR_LENGTH\(bonus\) <= \$\{OFFER_DETAILS_MAX_LENGTHS\.bonus\}/);
    assert.match(table, /annual_leave_days INTEGER\s+CHECK/);
    assert.doesNotMatch(table, /annual_leave_days INTEGER NOT NULL/);
    assert.match(table, /BETWEEN 0 AND \$\{OFFER_ANNUAL_LEAVE_DAYS_MAX\}/);
    assert.match(table, /work_arrangement TEXT NOT NULL DEFAULT ''/);
    assert.match(table, /work_arrangement IN \(\$\{OFFER_WORK_ARRANGEMENT_SQL_VALUES\}\)/);
    assert.match(table, /decision_deadline TIMESTAMPTZ NOT NULL/);
    assert.match(table, /pros TEXT NOT NULL DEFAULT ''/);
    assert.match(table, /concerns TEXT NOT NULL DEFAULT ''/);
    assert.match(table, /CHAR_LENGTH\(pros\) <= \$\{OFFER_DETAILS_MAX_LENGTHS\.notes\}/);
    assert.match(table, /CHAR_LENGTH\(concerns\) <= \$\{OFFER_DETAILS_MAX_LENGTHS\.notes\}/);
    assert.doesNotMatch(table, /updated_at/);
    assert.match(table, /PRIMARY KEY \(job_id, user_id\)/);
    assert.match(table, /CONSTRAINT offer_evaluations_job_user_fk/);
    assert.match(table, /FOREIGN KEY \(job_id, user_id\)/);
    assert.match(table, /REFERENCES job_applications\(job_id, user_id\)/);
    assert.match(table, /ON DELETE CASCADE/);
    assert.ok(setupQueries.indexOf('createJobAppTable') < setupQueries.indexOf('createOfferEvaluationTable'));
    assert.doesNotMatch(source, /ALTER TABLE offer_evaluations/);
});

test('validates complete bounded offer decision values', () => {
    assert.equal(httpValidation.isOfferDecisionValues(validValues), true);
    assert.equal(httpValidation.isOfferDecisionValues({ ...validValues, career_growth: 1 }), true);
    assert.equal(httpValidation.isOfferDecisionValues({ ...validValues, career_growth: 5 }), true);

    for (const invalidValues of [
        { ...validValues, career_growth: 0 },
        { ...validValues, career_growth: 6 },
        { ...validValues, career_growth: 2.5 },
        { ...validValues, career_growth: '3' },
        { ...validValues, career_growth: null },
        { ...validValues, compensation: undefined },
        [],
        null,
    ]) {
        assert.equal(httpValidation.isOfferDecisionValues(invalidValues), false);
    }
});

test('validates required offer details and bounded optional details', () => {
    assert.equal(httpValidation.isOfferDetails(validDetails), true);

    for (const invalidDetails of [
        { ...validDetails, currency: '' },
        { ...validDetails, currency: 'sgd' },
        { ...validDetails, currency: 'SG' },
        { ...validDetails, monthly_base_salary: null },
        { ...validDetails, monthly_base_salary: -1 },
        { ...validDetails, monthly_base_salary: 1.5 },
        { ...validDetails, monthly_base_salary: validationConfig.OFFER_MONTHLY_BASE_SALARY_MAX + 1 },
        { ...validDetails, bonus: ` ${validDetails.bonus}` },
        { ...validDetails, bonus: 'x'.repeat(validationConfig.OFFER_DETAILS_MAX_LENGTHS.bonus + 1) },
        { ...validDetails, annual_leave_days: -1 },
        { ...validDetails, annual_leave_days: 1.5 },
        { ...validDetails, annual_leave_days: 366 },
        { ...validDetails, work_arrangement: 'Sometimes remote' },
        { ...validDetails, decision_deadline: '' },
        { ...validDetails, decision_deadline: '2026-02-30T10:00:00.000Z' },
        { ...validDetails, decision_deadline: '2026-07-18T18:00' },
        { ...validDetails, concerns: 'x'.repeat(validationConfig.OFFER_DETAILS_MAX_LENGTHS.notes + 1) },
        null,
    ]) {
        assert.equal(httpValidation.isOfferDetails(invalidDetails), false);
    }
});

test('validates one normalized offer evaluation request instead of a bulk request', () => {
    assert.equal(typeof httpValidation.isSaveOfferEvaluationRequest, 'function');
    assert.equal(httpValidation.isSaveOfferEvaluationRequest(validRequest), true);
    assert.equal(httpValidation.isSaveOfferEvaluationRequest({ ...validRequest, ratings: null }), false);
    assert.equal(httpValidation.isSaveOfferEvaluationRequest({ ...validRequest, details: null }), false);
    assert.equal(httpValidation.isSaveOfferEvaluationRequest({ evaluations: [], importance: validValues }), false);
    assert.equal(httpValidation.isSaveOfferEvaluationRequest(null), false);
});

test('loads the active workspace in one user-scoped query and maps optional evaluations', async () => {
    const calls = [];
    const workspace = await withMockedPoolQuery(
        async (sql, values) => {
            calls.push({ sql: compactSQL(sql), values });
            return {
                rows: [
                    {
                        job_id: 11,
                        company_name: 'Acme',
                        job_title: 'Engineer',
                        job_status: 'Offer',
                        application_date: '2026-07-01T08:00:00.000Z',
                        evaluation_job_id: 11,
                        career_growth_rating: 5,
                        company_culture_fit_rating: 4,
                        work_life_balance_rating: 3,
                        compensation_rating: 4,
                        currency: 'SGD',
                        monthly_base_salary: 10000,
                        bonus: '15% target',
                        annual_leave_days: 21,
                        work_arrangement: 'Hybrid',
                        decision_deadline: new Date(validDetails.decision_deadline),
                        pros: 'Strong product ownership',
                        concerns: 'Two office days each week',
                    },
                    {
                        job_id: 12,
                        company_name: 'Beta',
                        job_title: 'Developer',
                        job_status: 'Offer',
                        application_date: '2026-07-02T08:00:00.000Z',
                        evaluation_job_id: null,
                    },
                ],
            };
        },
        () => offerDecisionQueries.getOfferDecisionWorkspace(7, false, activeFilters)
    );

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].values, [7, false, activeFilters]);
    assert.match(calls[0].sql, /applications\.application_date/);
    assert.match(calls[0].sql, /evaluations\.user_id = applications\.user_id/);
    assert.match(calls[0].sql, /applications\.user_id = \$1/);
    assert.match(calls[0].sql, /applications\.is_archived = \$2/);
    assert.match(calls[0].sql, /applications\.job_status = 'Offer'/);
    assert.match(calls[0].sql, /'Offers to Evaluate' = ANY\(\$3::text\[\]\)/);
    assert.match(calls[0].sql, /'Evaluated Offers' = ANY\(\$3::text\[\]\)/);
    assert.match(calls[0].sql, /'Expired Evaluated Offers' = ANY\(\$3::text\[\]\)/);
    assert.match(calls[0].sql, /'Previous Evaluations' = ANY\(\$3::text\[\]\)/);
    assert.match(calls[0].sql, /evaluations\.decision_deadline IS NULL\s+OR evaluations\.decision_deadline >= NOW\(\)/);
    assert.match(calls[0].sql, /evaluations\.decision_deadline < NOW\(\)/);
    assert.doesNotMatch(calls[0].sql, /updated_at/);
    assert.doesNotMatch(calls[0].sql, /latest_importance|importance|equity|\bbase_salary\b/);
    assert.deepEqual(workspace, {
        applications: [
            {
                job_id: 11,
                company_name: 'Acme',
                job_title: 'Engineer',
                job_status: 'Offer',
                application_date: '2026-07-01T08:00:00.000Z',
                evaluation: {
                    job_id: 11,
                    ratings: {
                        ...validValues,
                        career_growth: 5,
                        company_culture_fit: 4,
                        compensation: 4,
                    },
                    details: validDetails,
                },
            },
            {
                job_id: 12,
                company_name: 'Beta',
                job_title: 'Developer',
                job_status: 'Offer',
                application_date: '2026-07-02T08:00:00.000Z',
                evaluation: null,
            },
        ],
    });
});

test('loads only saved archived evaluations and returns an empty application list', async () => {
    const calls = [];
    const workspace = await withMockedPoolQuery(
        async (sql, values) => {
            calls.push({ sql: compactSQL(sql), values });
            return { rows: [] };
        },
        () => offerDecisionQueries.getOfferDecisionWorkspace(8, true, archivedFilters)
    );

    assert.deepEqual(calls[0].values, [8, true, archivedFilters]);
    assert.match(calls[0].sql, /\(\$2 = true AND evaluations\.job_id IS NOT NULL\)/);
    assert.deepEqual(workspace, { applications: [] });
});

test('saves one offer evaluation at the application timestamp atomically', async () => {
    assert.equal(typeof offerDecisionQueries.saveOfferEvaluation, 'function');
    const calls = [];
    await withMockedPoolClient(
        async (sql, values) => {
            calls.push({ sql: compactSQL(sql), values });
            if (String(sql).includes('FOR UPDATE OF applications')) {
                return {
                    rows: [{ job_id: 11, job_status: 'Offer', application_date: validDetails.decision_deadline }],
                };
            }
            return { rows: [], rowCount: 1 };
        },
        async (wasReleased) => {
            assert.equal(await offerDecisionQueries.saveOfferEvaluation(7, 11, validRequest), 'saved');
            assert.equal(wasReleased(), true);
        }
    );

    assert.equal(calls[0].sql, 'BEGIN');
    assert.match(calls[1].sql, /applications\.is_archived = false/);
    assert.match(calls[1].sql, /applications\.job_id = \$2/);
    assert.match(calls[1].sql, /applications\.application_date/);
    assert.match(calls[1].sql, /FOR UPDATE OF applications/);
    assert.deepEqual(calls[1].values, [7, 11]);
    assert.match(calls[2].sql, /INSERT INTO offer_evaluations/);
    assert.match(calls[2].sql, /monthly_base_salary/);
    assert.doesNotMatch(calls[2].sql, /importance|equity|\bbase_salary\b/);
    assert.match(calls[2].sql, /ON CONFLICT \(job_id, user_id\) DO UPDATE/);
    assert.doesNotMatch(calls[2].sql, /updated_at/);
    assert.equal(calls[3].sql, 'COMMIT');
});

test('rolls back before upsert when the deadline is earlier than the application date', async () => {
    const calls = [];
    await withMockedPoolClient(
        async (sql) => {
            calls.push(compactSQL(sql));
            if (String(sql).includes('FOR UPDATE OF applications')) {
                return { rows: [{ job_id: 11, job_status: 'Offer', application_date: '2026-07-18T10:01:00.000Z' }] };
            }
            return { rows: [] };
        },
        async (wasReleased) => {
            assert.equal(
                await offerDecisionQueries.saveOfferEvaluation(7, 11, validRequest),
                'deadline_before_application'
            );
            assert.equal(wasReleased(), true);
        }
    );

    assert.deepEqual(calls, ['BEGIN', calls[1], 'ROLLBACK']);
});

test('rolls back without upserting when the application is unavailable', async () => {
    const calls = [];
    await withMockedPoolClient(
        async (sql) => {
            calls.push(compactSQL(sql));
            if (String(sql).includes('FOR UPDATE OF applications')) {
                return { rows: [] };
            }
            return { rows: [] };
        },
        async () => {
            assert.equal(
                await offerDecisionQueries.saveOfferEvaluation(7, 11, validRequest),
                'application_unavailable'
            );
        }
    );

    assert.deepEqual(calls, ['BEGIN', calls[1], 'ROLLBACK']);
});

test('rolls back, rethrows, and releases after a save error', async () => {
    const expectedError = new Error('save failed');
    const calls = [];

    await withMockedPoolClient(
        async (sql) => {
            calls.push(compactSQL(sql));
            if (String(sql).includes('FOR UPDATE OF applications')) {
                return {
                    rows: [{ job_id: 11, job_status: 'Offer', application_date: validDetails.decision_deadline }],
                };
            }
            if (String(sql).includes('INSERT INTO offer_evaluations')) {
                throw expectedError;
            }
            return { rows: [] };
        },
        async (wasReleased) => {
            await assert.rejects(offerDecisionQueries.saveOfferEvaluation(7, 11, validRequest), expectedError);
            assert.equal(wasReleased(), true);
        }
    );

    assert.equal(calls.at(-1), 'ROLLBACK');
});

test('routes active and archived workspace reads through their matching query mode', async () => {
    const activeHandler = getRouteHandler('get', '/');
    const archivedHandler = getRouteHandler('get', '/archived');
    assert.equal(typeof activeHandler, 'function');
    assert.equal(typeof archivedHandler, 'function');

    const calls = [];
    await withMockedPoolQuery(
        async (_sql, values) => {
            calls.push(values);
            return { rows: [] };
        },
        async () => {
            const activeResponse = createResponse();
            const archivedResponse = createResponse();
            await activeHandler({ query: {}, user: { id: 7 } }, activeResponse);
            await archivedHandler({ query: {}, user: { id: 7 } }, archivedResponse);

            assert.equal(activeResponse.statusCode, 200);
            assert.deepEqual(activeResponse.body, { applications: [] });
            assert.equal(archivedResponse.statusCode, 200);
            assert.deepEqual(archivedResponse.body, { applications: [] });
        }
    );

    assert.deepEqual(calls, [
        [7, false, activeFilters],
        [7, true, archivedFilters],
    ]);
});

test('rejects unsupported and archive-incompatible offer GET filters', async () => {
    const activeHandler = getRouteHandler('get', '/');
    const archivedHandler = getRouteHandler('get', '/archived');

    const activeResponse = createResponse();
    await activeHandler({ query: { filters: 'Unknown' }, user: { id: 7 } }, activeResponse);
    assert.equal(activeResponse.statusCode, 422);
    assert.deepEqual(activeResponse.body, { message: 'Each offer comparison filter must be supported.' });

    const archivedResponse = createResponse();
    await archivedHandler({ query: { filters: 'Offers to Evaluate' }, user: { id: 7 } }, archivedResponse);
    assert.equal(archivedResponse.statusCode, 422);
    assert.deepEqual(archivedResponse.body, { message: 'Each offer comparison filter must be supported.' });
});

test('rejects malformed per-offer saves before database access', async () => {
    const handler = getRouteHandler('put', '/:jobId');
    assert.equal(typeof handler, 'function');
    let connectCount = 0;
    const originalConnect = pool.connect;
    pool.connect = async () => {
        connectCount += 1;
        throw new Error('must not connect');
    };

    try {
        const invalidIdResponse = createResponse();
        await handler({ body: validRequest, params: { jobId: 'nope' }, user: { id: 7 } }, invalidIdResponse);
        assert.equal(invalidIdResponse.statusCode, 422);

        const invalidBodyResponse = createResponse();
        await handler({ body: { ratings: null }, params: { jobId: '11' }, user: { id: 7 } }, invalidBodyResponse);
        assert.equal(invalidBodyResponse.statusCode, 422);
        assert.deepEqual(invalidBodyResponse.body, { message: 'Offer evaluation fields are missing or invalid.' });
    } finally {
        pool.connect = originalConnect;
    }

    assert.equal(connectCount, 0);
});

test('maps singular save results to unavailable, deadline, and success responses', async () => {
    const handler = getRouteHandler('put', '/:jobId');
    assert.equal(typeof handler, 'function');
    const lockedRows = [
        [],
        [{ job_id: 11, job_status: 'Offer', application_date: '2026-07-18T10:01:00.000Z' }],
        [{ job_id: 11, job_status: 'Offer', application_date: validDetails.decision_deadline }],
    ];

    await withMockedPoolClient(
        async (sql) => {
            if (String(sql).includes('FOR UPDATE OF applications')) {
                return { rows: lockedRows.shift() };
            }
            return { rows: [] };
        },
        async () => {
            const unavailableResponse = createResponse();
            await handler({ body: validRequest, params: { jobId: '11' }, user: { id: 7 } }, unavailableResponse);
            assert.equal(unavailableResponse.statusCode, 409);
            assert.deepEqual(unavailableResponse.body, {
                message: 'Only active applications with Offer status can be saved.',
            });

            const deadlineResponse = createResponse();
            await handler({ body: validRequest, params: { jobId: '11' }, user: { id: 7 } }, deadlineResponse);
            assert.equal(deadlineResponse.statusCode, 422);
            assert.deepEqual(deadlineResponse.body, {
                message: 'Decision deadline cannot be earlier than the application date.',
            });

            const successResponse = createResponse();
            await handler({ body: validRequest, params: { jobId: '11' }, user: { id: 7 } }, successResponse);
            assert.equal(successResponse.statusCode, 204);
            assert.equal(successResponse.body, undefined);
        }
    );
});

test('deletes a user-owned evaluation attached to an active or archived application', async () => {
    const calls = [];
    const deleted = await withMockedPoolQuery(
        async (sql, values) => {
            calls.push({ sql: compactSQL(sql), values });
            return { rows: [{ job_id: 11 }], rowCount: 1 };
        },
        () => offerDecisionQueries.deleteOfferEvaluation(7, 11)
    );

    assert.equal(deleted, true);
    assert.deepEqual(calls[0].values, [7, 11]);
    assert.match(calls[0].sql, /DELETE FROM offer_evaluations AS evaluations/);
    assert.match(calls[0].sql, /applications\.user_id = evaluations\.user_id/);
    assert.doesNotMatch(calls[0].sql, /applications\.is_archived = false/);
    assert.match(calls[0].sql, /RETURNING evaluations\.job_id/);
});

test('deletes only user-owned evaluations in the requested application collection', async () => {
    const calls = [];
    await withMockedPoolQuery(
        async (sql, values) => {
            calls.push({ sql: compactSQL(sql), values });
            return { rows: [], rowCount: 2 };
        },
        async () => {
            await offerDecisionQueries.deleteAllOfferEvaluations(7, false);
            await offerDecisionQueries.deleteAllOfferEvaluations(7, true);
        }
    );

    assert.deepEqual(
        calls.map((call) => call.values),
        [
            [7, false],
            [7, true],
        ]
    );
    for (const call of calls) {
        assert.match(call.sql, /DELETE FROM offer_evaluations AS evaluations/);
        assert.match(call.sql, /applications\.user_id = evaluations\.user_id/);
        assert.match(call.sql, /applications\.is_archived = \$2/);
        assert.doesNotMatch(call.sql, /DELETE FROM job_applications/);
    }
});

test('routes active and archived bulk evaluation deletion through exact scopes', async () => {
    const activeHandler = getRouteHandler('delete', '/');
    const archivedHandler = getRouteHandler('delete', '/archived');
    assert.equal(typeof activeHandler, 'function');
    assert.equal(typeof archivedHandler, 'function');

    const calls = [];
    await withMockedPoolQuery(
        async (_sql, values) => {
            calls.push(values);
            return { rows: [], rowCount: 1 };
        },
        async () => {
            const activeResponse = createResponse();
            const archivedResponse = createResponse();
            await activeHandler({ user: { id: 7 } }, activeResponse);
            await archivedHandler({ user: { id: 7 } }, archivedResponse);

            assert.equal(activeResponse.statusCode, 204);
            assert.equal(archivedResponse.statusCode, 204);
        }
    );

    assert.deepEqual(calls, [
        [7, false],
        [7, true],
    ]);
});

test('validates evaluation deletion and returns not found without exposing ownership', async () => {
    const handler = getRouteHandler('delete', '/:jobId');
    assert.equal(typeof handler, 'function');

    const invalidResponse = createResponse();
    await handler({ params: { jobId: 'nope' }, user: { id: 7 } }, invalidResponse);
    assert.equal(invalidResponse.statusCode, 422);

    await withMockedPoolQuery(
        async () => ({ rows: [], rowCount: 0 }),
        async () => {
            const response = createResponse();
            await handler({ params: { jobId: '11' }, user: { id: 7 } }, response);
            assert.equal(response.statusCode, 404);
            assert.deepEqual(response.body, { message: 'Offer evaluation was not found.' });
        }
    );
});
