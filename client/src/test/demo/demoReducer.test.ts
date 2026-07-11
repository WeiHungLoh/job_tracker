import { JOB_STATUSES } from '../../pages/application/models';
import { createDemoInitialState } from '../../pages/demo/state/demoInitialState';
import { demoReducer } from '../../pages/demo/state/demoReducer';
import { selectJobStatusCounts, selectWeeklyApplications } from '../../pages/demo/state/demoSelectors';

const fixedNow = new Date(2026, 6, 7, 12, 0, 0, 0);

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
            payload: { jobId: 101, editStatus: false, jobStatus: 'Offer' },
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

        const restored = demoReducer(archived, { type: 'RESTORE_APPLICATION', payload: { archivedJobId: 107 } });

        expect(restored.applications.some((application) => application.job_id === 107)).toBe(true);
        expect(restored.interviews.filter((interview) => interview.job_id === 107)).toHaveLength(2);
        expect(restored.archivedApplications.some((application) => application.archived_job_id === 107)).toBe(false);
        expect(restored.archivedInterviews.some((interview) => interview.archived_job_id === 107)).toBe(false);
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
        expect(unarchived.applications.every((application) => application.edit_status === false)).toBe(true);
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
                interviewLocation: 'Zoom',
                interviewType: 'Technical interview',
                notes: 'Bring examples',
            },
        });
        const nextInterviewId = state.nextInterviewId;

        expect(created.interviews.some((interview) => interview.interview_id === nextInterviewId)).toBe(true);
        expect(created.nextInterviewId).toBe(nextInterviewId + 1);

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
            },
        });
        const reset = demoReducer(updatedPreferences, { type: 'RESET_DEMO', payload: { now: fixedNow } });

        expect(updatedPreferences.preferences.application_job_statuses).toEqual(['Offer']);
        expect(updatedPreferences.preferences.application_show_notes).toBe(false);
        expect(updatedPreferences.preferences.application_view_mode).toBe('board');
        expect(reset.applications).toHaveLength(20);
        expect(reset.preferences.application_job_statuses).toEqual([...JOB_STATUSES]);
        expect(reset.preferences.application_show_notes).toBe(true);
        expect(reset.preferences.application_show_archive).toBe(true);
        expect(reset.preferences.application_enable_scroll).toBe(true);
        expect(reset.preferences.archived_application_show_notes).toBe(true);
        expect(reset.preferences.application_view_mode).toBe('list');
        expect(reset.preferences.interview_view_mode).toBe('list');
        expect(reset.preferences.archived_interview_view_mode).toBe('list');
        expect(reset.applications).not.toBe(state.applications);
    });
});
