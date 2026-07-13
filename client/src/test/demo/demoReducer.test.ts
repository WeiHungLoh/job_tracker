import { JOB_STATUSES } from '../../pages/application/models';
import { createDemoInitialState } from '../../pages/demo/state/demoInitialState';
import { demoReducer } from '../../pages/demo/state/demoReducer';
import {
    selectApplications,
    selectArchivedApplications,
    selectJobStatusCounts,
    selectWeeklyApplications,
    sortInterviews,
} from '../../pages/demo/state/demoSelectors';
import { createInterviewCsvData } from '../../helper/csvData';

const fixedNow = new Date(2026, 6, 7, 12, 0, 0, 0);
const fixedNowMs = fixedNow.getTime();

describe('demo reducer state', () => {
    test('creates a complete deterministic fixture set', () => {
        const state = createDemoInitialState(fixedNow);
        const coveredStatuses = new Set(state.applications.map((application) => application.job_status));
        const applicationTimes = state.applications.map((application) =>
            new Date(application.application_date).getTime()
        );
        const earliestApplicationAgeDays = (fixedNow.getTime() - Math.min(...applicationTimes)) / (24 * 60 * 60 * 1000);

        expect(state.applications).toHaveLength(20);
        expect(state.interviews).toHaveLength(9);
        expect(state.archivedApplications.length).toBeGreaterThanOrEqual(4);
        expect(state.archivedInterviews.length).toBeGreaterThanOrEqual(3);
        expect(JOB_STATUSES.every((status) => coveredStatuses.has(status))).toBe(true);
        expect(earliestApplicationAgeDays).toBeGreaterThanOrEqual(49);

        const activeApplicationIds = new Set(state.applications.map((application) => application.job_id));
        const archivedApplicationIds = new Set(
            state.archivedApplications.map((application) => application.archived_job_id)
        );

        expect(state.interviews.every((interview) => activeApplicationIds.has(interview.job_id))).toBe(true);
        expect(
            state.archivedInterviews.every((interview) => archivedApplicationIds.has(interview.archived_job_id))
        ).toBe(true);
        expect(state.interviews.filter((interview) => new Date(interview.interview_date) > fixedNow).length).toBe(7);
        expect(
            state.interviews
                .filter((interview) => interview.interview_id >= 407)
                .map((interview) => new Date(interview.interview_date).getUTCFullYear())
        ).toEqual([2027, 2027, 2028]);
        const sortedInterviews = sortInterviews(state.interviews, fixedNowMs);
        const sortedArchivedInterviews = sortInterviews(state.archivedInterviews, fixedNowMs);

        expect(sortedInterviews.map((interview) => interview.interview_id)).toEqual([
            401, 402, 403, 404, 407, 408, 409, 406, 405,
        ]);
        expect(sortedArchivedInterviews.map((interview) => interview.archived_interview_id)).toEqual([
            504, 503, 502, 501,
        ]);
        expect(createInterviewCsvData(sortedInterviews).map((interview) => interview.interview_id)).toEqual([
            401, 402, 403, 404, 407, 408, 409, 406, 405,
        ]);
        expect(
            createInterviewCsvData(sortedArchivedInterviews).map((interview) => interview.archived_interview_id)
        ).toEqual([504, 503, 502, 501]);
    });

    test('sorts active and archived interviews like production without mutating the input', () => {
        const day = 24 * 60 * 60 * 1000;
        const interviews = [
            {
                id: 'later future',
                interview_date: new Date(fixedNowMs + 4 * day).toISOString(),
                interview_duration_minutes: 60,
            },
            {
                id: 'recent past',
                interview_date: new Date(fixedNowMs - day).toISOString(),
                interview_duration_minutes: 60,
            },
            {
                id: 'nearest future',
                interview_date: new Date(fixedNowMs + day).toISOString(),
                interview_duration_minutes: 60,
            },
            {
                id: 'oldest past',
                interview_date: new Date(fixedNowMs - 3 * day).toISOString(),
                interview_duration_minutes: 60,
            },
            { id: 'due now', interview_date: fixedNow.toISOString(), interview_duration_minutes: 60 },
        ];
        const originalOrder = [...interviews];

        expect(sortInterviews(interviews, fixedNowMs).map((interview) => interview.id)).toEqual([
            'due now',
            'nearest future',
            'later future',
            'oldest past',
            'recent past',
        ]);
        expect(interviews).toEqual(originalOrder);
        expect(sortInterviews(interviews, fixedNowMs)).not.toBe(interviews);

        const archivedInterviews = interviews.map((interview, index) => ({
            archived_interview_id: index + 1,
            interview_date: interview.interview_date,
            interview_duration_minutes: interview.interview_duration_minutes,
        }));
        expect(
            sortInterviews(archivedInterviews, fixedNowMs).map((interview) => interview.archived_interview_id)
        ).toEqual([5, 3, 1, 4, 2]);
    });

    test('uses independent list and board sorting preferences for demo applications', () => {
        const state = createDemoInitialState(fixedNow);
        const customSortPreferences = demoReducer(state, {
            type: 'UPDATE_PREFERENCES',
            payload: {
                application_list_sort_order: 'company_name_asc',
                application_board_sort_order: 'application_date_asc',
                archived_application_list_sort_order: 'company_name_desc',
                archived_application_board_sort_order: 'application_date_asc',
            },
        });

        expect(selectApplications(customSortPreferences)[0].company_name).toBe('Aster Security');
        expect(selectArchivedApplications(customSortPreferences)[0].company_name).toBe('SilverRail Labs');

        const boardPreferences = demoReducer(customSortPreferences, {
            type: 'UPDATE_PREFERENCES',
            payload: {
                application_view_mode: 'board',
                archived_application_view_mode: 'board',
            },
        });

        expect(selectApplications(boardPreferences)[0].company_name).toBe('Cedar FinTech');
        expect(selectArchivedApplications(boardPreferences)[0].company_name).toBe('OrbitPay');

        const restoredListPreferences = demoReducer(boardPreferences, {
            type: 'UPDATE_PREFERENCES',
            payload: {
                application_view_mode: 'list',
                archived_application_view_mode: 'list',
            },
        });

        expect(selectApplications(restoredListPreferences)[0].company_name).toBe('Aster Security');
        expect(selectArchivedApplications(restoredListPreferences)[0].company_name).toBe('SilverRail Labs');
    });

    test('creates applications with reducer-managed unique IDs and updates dashboard selectors', () => {
        const state = createDemoInitialState(fixedNow);
        const nextId = state.nextApplicationId;
        const updated = demoReducer(state, {
            type: 'CREATE_APPLICATION',
            payload: {
                companyName: 'Demo Company',
                jobTitle: 'Demo Engineer',
                applicationDate: fixedNow,
                jobStatus: 'Applied',
                jobLocation: 'Singapore',
                jobURL: 'https://jobs.example.com/demo-engineer',
            },
        });

        expect(updated.applications.some((application) => application.job_id === nextId)).toBe(true);
        expect(updated.nextApplicationId).toBe(nextId + 1);
        expect(selectJobStatusCounts(updated).find((row) => row.job_status === 'Applied')?.count).toBe('7');
        expect(
            selectWeeklyApplications(updated, fixedNow).reduce((sum, row) => sum + Number(row.applications_count), 0)
        ).toBeGreaterThan(
            selectWeeklyApplications(state, fixedNow).reduce((sum, row) => sum + Number(row.applications_count), 0)
        );
    });

    test('updates application status and notes', () => {
        const state = createDemoInitialState(fixedNow);
        const statusUpdated = demoReducer(state, {
            type: 'UPDATE_APPLICATION_STATUS',
            payload: { jobId: 101, jobStatus: 'Offer' },
        });
        const notesUpdated = demoReducer(statusUpdated, {
            type: 'UPDATE_APPLICATION_NOTES',
            payload: { jobId: 101, notes: 'Updated demo notes' },
        });

        expect(notesUpdated.applications.find((application) => application.job_id === 101)?.job_status).toBe('Offer');
        expect(notesUpdated.applications.find((application) => application.job_id === 101)?.notes).toBe(
            'Updated demo notes'
        );
    });

    test('archives and restores applications with linked interviews', () => {
        const state = createDemoInitialState(fixedNow);
        const archived = demoReducer(state, { type: 'ARCHIVE_APPLICATION', payload: { jobId: 107 } });

        expect(archived.applications.some((application) => application.job_id === 107)).toBe(false);
        expect(archived.interviews.some((interview) => interview.job_id === 107)).toBe(false);
        expect(archived.archivedApplications.some((application) => application.archived_job_id === 107)).toBe(true);
        expect(archived.archivedInterviews.filter((interview) => interview.archived_job_id === 107)).toHaveLength(2);
        expect(
            sortInterviews(archived.archivedInterviews, fixedNowMs).map((interview) => interview.archived_interview_id)
        ).toEqual([401, 504, 503, 502, 501, 405]);

        const restored = demoReducer(archived, { type: 'RESTORE_APPLICATION', payload: { archivedJobId: 107 } });

        expect(restored.applications.some((application) => application.job_id === 107)).toBe(true);
        expect(restored.interviews.filter((interview) => interview.job_id === 107)).toHaveLength(2);
        expect(restored.archivedApplications.some((application) => application.archived_job_id === 107)).toBe(false);
        expect(restored.archivedInterviews.some((interview) => interview.archived_job_id === 107)).toBe(false);
        expect(sortInterviews(restored.interviews, fixedNowMs).map((interview) => interview.interview_id)).toEqual([
            401, 402, 403, 404, 407, 408, 409, 406, 405,
        ]);
    });

    test('bulk archives and unarchives complete collections with linked interviews', () => {
        const state = createDemoInitialState(fixedNow);
        const originalArchivedApplicationCount = state.archivedApplications.length;
        const originalArchivedInterviewCount = state.archivedInterviews.length;
        const archived = demoReducer(state, { type: 'ARCHIVE_ALL_APPLICATIONS' });

        expect(archived.applications).toHaveLength(0);
        expect(archived.interviews).toHaveLength(0);
        expect(archived.archivedApplications).toHaveLength(
            originalArchivedApplicationCount + state.applications.length
        );
        expect(archived.archivedInterviews).toHaveLength(originalArchivedInterviewCount + state.interviews.length);

        const unarchived = demoReducer(archived, { type: 'UNARCHIVE_ALL_APPLICATIONS' });
        expect(unarchived.archivedApplications).toHaveLength(0);
        expect(unarchived.archivedInterviews).toHaveLength(0);
        expect(unarchived.applications).toHaveLength(originalArchivedApplicationCount + state.applications.length);
        expect(unarchived.interviews).toHaveLength(originalArchivedInterviewCount + state.interviews.length);
        expect(sortInterviews(unarchived.interviews, fixedNowMs).map((interview) => interview.interview_id)).toEqual([
            401, 402, 403, 404, 407, 408, 409, 504, 503, 502, 501, 406, 405,
        ]);
    });

    test('deletes applications and archived applications with linked interviews', () => {
        const state = createDemoInitialState(fixedNow);
        const activeDeleted = demoReducer(state, { type: 'DELETE_APPLICATION', payload: { jobId: 107 } });
        const archivedDeleted = demoReducer(state, {
            type: 'DELETE_ARCHIVED_APPLICATION',
            payload: { archivedJobId: 201 },
        });

        expect(activeDeleted.applications.some((application) => application.job_id === 107)).toBe(false);
        expect(activeDeleted.interviews.some((interview) => interview.job_id === 107)).toBe(false);
        expect(archivedDeleted.archivedApplications.some((application) => application.archived_job_id === 201)).toBe(
            false
        );
        expect(archivedDeleted.archivedInterviews.some((interview) => interview.archived_job_id === 201)).toBe(false);
    });

    test('creates and deletes interviews', () => {
        const state = createDemoInitialState(fixedNow);
        const created = demoReducer(state, {
            type: 'CREATE_INTERVIEW',
            payload: {
                jobId: 101,
                interviewDate: new Date(2026, 6, 12, 10, 0, 0, 0),
                interviewDurationMinutes: 60,
                interviewLocation: 'Zoom',
                interviewType: 'Technical interview',
                notes: 'Bring examples',
            },
        });
        const nextInterviewId = state.nextInterviewId;

        expect(created.interviews.some((interview) => interview.interview_id === nextInterviewId)).toBe(true);
        expect(created.nextInterviewId).toBe(nextInterviewId + 1);
        expect(created.interviews.at(-1)?.interview_id).toBe(nextInterviewId);
        expect(
            sortInterviews(created.interviews, fixedNowMs)
                .slice(0, 3)
                .map((interview) => interview.interview_id)
        ).toEqual([401, nextInterviewId, 402]);

        const deleted = demoReducer(created, { type: 'DELETE_INTERVIEW', payload: { interviewId: nextInterviewId } });
        expect(deleted.interviews.some((interview) => interview.interview_id === nextInterviewId)).toBe(false);
    });

    test('updates preferences and resets to fresh default state', () => {
        const state = createDemoInitialState(fixedNow);
        const updatedPreferences = demoReducer(state, {
            type: 'UPDATE_PREFERENCES',
            payload: {
                application_job_statuses: ['Offer'],
                application_show_notes: false,
                application_view_mode: 'board',
                interview_time_filters: ['Past Interviews'],
            },
        });
        const reset = demoReducer(updatedPreferences, { type: 'RESET_DEMO', payload: { now: fixedNow } });

        expect(updatedPreferences.preferences.application_job_statuses).toEqual(['Offer']);
        expect(updatedPreferences.preferences.application_show_notes).toBe(false);
        expect(updatedPreferences.preferences.application_view_mode).toBe('board');
        expect(updatedPreferences.preferences.interview_time_filters).toEqual(['Past Interviews']);
        expect(updatedPreferences.preferences.archived_interview_time_filters).toEqual([
            'Upcoming Interviews',
            'Past Interviews',
        ]);
        expect(reset.applications).toHaveLength(20);
        expect(reset.preferences.application_job_statuses).toEqual([...JOB_STATUSES]);
        expect(reset.preferences.application_show_notes).toBe(true);
        expect(reset.preferences.application_show_archive).toBe(true);
        expect(reset.preferences.application_enable_scroll).toBe(true);
        expect(reset.preferences.archived_application_show_notes).toBe(true);
        expect(reset.preferences.application_view_mode).toBe('list');
        expect(reset.preferences.application_list_sort_order).toBe('job_status');
        expect(reset.preferences.application_board_sort_order).toBe('application_date_desc');
        expect(reset.preferences.archived_application_list_sort_order).toBe('job_status');
        expect(reset.preferences.archived_application_board_sort_order).toBe('application_date_desc');
        expect(reset.preferences.interview_view_mode).toBe('list');
        expect(reset.preferences.archived_interview_view_mode).toBe('list');
        expect(reset.preferences.interview_time_filters).toEqual(['Upcoming Interviews', 'Past Interviews']);
        expect(reset.preferences.archived_interview_time_filters).toEqual(['Upcoming Interviews', 'Past Interviews']);
        expect(reset.applications).not.toBe(state.applications);
        expect(sortInterviews(reset.interviews, fixedNowMs).map((interview) => interview.interview_id)).toEqual([
            401, 402, 403, 404, 407, 408, 409, 406, 405,
        ]);
    });
});
