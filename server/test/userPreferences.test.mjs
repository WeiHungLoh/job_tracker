import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    APPLICATION_BOARD_SORT_ORDERS,
    APPLICATION_LIST_SORT_ORDERS,
    DEFAULT_APPLICATION_BOARD_SORT_ORDER,
    DEFAULT_APPLICATION_LIST_SORT_ORDER,
} from '../dist/db/models.js';
import { pool } from '../dist/db/connectDB.js';
import { getUserPreferences, updateUserPreferences } from '../dist/db/queries/userPreferences.js';
import {
    isApplicationBoardSortOrder,
    isApplicationListSortOrder,
    isOptionalApplicationBoardSortOrder,
    isOptionalApplicationListSortOrder,
} from '../dist/http/validation.js';

test('application sort order constants, defaults, and validators agree', () => {
    assert.deepEqual(APPLICATION_LIST_SORT_ORDERS, [
        'job_status',
        'application_date_desc',
        'application_date_asc',
        'company_name_asc',
        'company_name_desc',
    ]);
    assert.deepEqual(APPLICATION_BOARD_SORT_ORDERS, [
        'application_date_desc',
        'application_date_asc',
        'company_name_asc',
        'company_name_desc',
    ]);
    assert.equal(DEFAULT_APPLICATION_LIST_SORT_ORDER, 'job_status');
    assert.equal(DEFAULT_APPLICATION_BOARD_SORT_ORDER, 'application_date_desc');

    for (const sortOrder of APPLICATION_LIST_SORT_ORDERS) {
        assert.equal(isApplicationListSortOrder(sortOrder), true);
    }
    for (const sortOrder of APPLICATION_BOARD_SORT_ORDERS) {
        assert.equal(isApplicationBoardSortOrder(sortOrder), true);
    }

    assert.equal(isApplicationBoardSortOrder('job_status'), false);
    assert.equal(isApplicationListSortOrder('unsupported'), false);
    assert.equal(isApplicationBoardSortOrder('unsupported'), false);
    assert.equal(isApplicationListSortOrder(1), false);
    assert.equal(isApplicationBoardSortOrder(null), false);
    assert.equal(isOptionalApplicationListSortOrder(undefined), true);
    assert.equal(isOptionalApplicationBoardSortOrder(undefined), true);
});

test('user preference queries read and update all sort fields with independent parameters', async () => {
    const originalQuery = pool.query;
    const calls = [];
    const storedPreferences = {
        application_job_statuses: ['Applied'],
        application_show_notes: true,
        application_show_archive: true,
        application_enable_scroll: true,
        application_view_mode: 'list',
        application_list_sort_order: 'company_name_asc',
        application_board_sort_order: 'application_date_asc',
        archived_application_job_statuses: ['Offer'],
        archived_application_show_notes: false,
        archived_application_view_mode: 'board',
        archived_application_list_sort_order: 'application_date_desc',
        archived_application_board_sort_order: 'company_name_desc',
        interview_view_mode: 'list',
        archived_interview_view_mode: 'board',
    };

    pool.query = async (sql, values) => {
        calls.push({ sql, values });
        return { rows: [storedPreferences] };
    };

    try {
        assert.deepEqual(await getUserPreferences(42), storedPreferences);
        assert.deepEqual(await updateUserPreferences(42, storedPreferences), storedPreferences);
    } finally {
        pool.query = originalQuery;
    }

    for (const field of [
        'application_list_sort_order',
        'application_board_sort_order',
        'archived_application_list_sort_order',
        'archived_application_board_sort_order',
    ]) {
        assert.match(calls[0].sql, new RegExp(`\\b${field}\\b`));
        assert.match(calls[1].sql, new RegExp(`\\b${field}\\b`));
    }

    assert.match(calls[1].sql, /application_list_sort_order = COALESCE\(\$7, application_list_sort_order\)/);
    assert.match(calls[1].sql, /application_board_sort_order = COALESCE\(\$8, application_board_sort_order\)/);
    assert.match(
        calls[1].sql,
        /archived_application_list_sort_order = COALESCE\(\$12, archived_application_list_sort_order\)/
    );
    assert.match(
        calls[1].sql,
        /archived_application_board_sort_order = COALESCE\(\$13, archived_application_board_sort_order\)/
    );
    assert.deepEqual(calls[1].values, [
        42,
        ['Applied'],
        true,
        true,
        true,
        'list',
        'company_name_asc',
        'application_date_asc',
        ['Offer'],
        false,
        'board',
        'application_date_desc',
        'company_name_desc',
        'list',
        'board',
    ]);
});

test('omitted sort preferences remain undefined for SQL COALESCE preservation', async () => {
    const originalQuery = pool.query;
    let values;
    pool.query = async (_sql, queryValues) => {
        values = queryValues;
        return { rows: [] };
    };

    try {
        await updateUserPreferences(9, { archived_application_board_sort_order: 'company_name_asc' });
    } finally {
        pool.query = originalQuery;
    }

    assert.equal(values.length, 15);
    assert.equal(values[0], 9);
    assert.equal(values[12], 'company_name_asc');
    assert.equal(
        values.slice(1, 12).every((value) => value === undefined),
        true
    );
    assert.equal(
        values.slice(13).every((value) => value === undefined),
        true
    );
});
