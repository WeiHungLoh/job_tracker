import type { JobApplication, JobStatus } from '../../pages/application/models';
import type { JobInterview } from '../../pages/interview/models';
import {
    ATTENTION_APPLICATION_STATUSES,
    FOLLOW_UP_AFTER_DAYS,
    MAX_ATTENTION_ITEMS,
    STALE_AFTER_DAYS,
    getAttentionItems,
} from '../../pages/dashboard/attentionCenter/attentionCenterData';

const now = new Date('2026-07-18T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const createApplication = (
    jobId: number,
    status: JobStatus,
    ageDays: number,
    companyName = `Company ${jobId}`
): JobApplication => ({
    job_id: jobId,
    company_name: companyName,
    job_title: `Role ${jobId}`,
    application_date: new Date(now.getTime() - ageDays * DAY_MS).toISOString(),
    job_status: status,
    job_location: '',
    job_posting_url: '',
    notes: '',
});

const createInterview = (interviewId: number, jobId: number, start: string, duration = 60): JobInterview => ({
    interview_id: interviewId,
    job_id: jobId,
    company_name: `Company ${jobId}`,
    job_title: `Role ${jobId}`,
    job_status: 'Interview',
    interview_date: start,
    interview_duration_minutes: duration,
    interview_location: '',
    interview_type: '',
    interview_notes: '',
});

describe('getAttentionItems', () => {
    test('uses only the three active statuses needed by the dashboard request', () => {
        expect(ATTENTION_APPLICATION_STATUSES).toEqual(['Applied', 'Interview', 'Offer']);
        expect(FOLLOW_UP_AFTER_DAYS).toBe(7);
        expect(STALE_AFTER_DAYS).toBe(21);
        expect(MAX_ATTENTION_ITEMS).toBe(6);
    });

    test('uses inclusive 7-day and 21-day boundaries', () => {
        const items = getAttentionItems(
            [
                createApplication(1, 'Applied', 6),
                createApplication(2, 'Applied', 7),
                createApplication(3, 'Applied', 20),
                createApplication(4, 'Applied', 21),
            ],
            [],
            now
        );

        expect(
            items.map(({ application, category, message }) => ({
                jobId: application.job_id,
                category,
                message,
            }))
        ).toEqual([
            {
                jobId: 4,
                category: 'stale-application',
                message: 'Applied 21 days ago with no interview scheduled.',
            },
            {
                jobId: 3,
                category: 'application-follow-up',
                message: 'Applied 20 days ago with no interview scheduled.',
            },
            {
                jobId: 2,
                category: 'application-follow-up',
                message: 'Applied 7 days ago with no interview scheduled.',
            },
        ]);
    });

    test('does not flag an Applied application when any interview is linked', () => {
        const application = createApplication(1, 'Applied', 30);
        const interview = createInterview(1, 1, '2026-07-01T10:00:00.000Z');

        expect(getAttentionItems([application], [interview], now)).toEqual([]);
    });

    test('flags Interview only when every linked interview is valid and has ended', () => {
        const completed = createApplication(1, 'Interview', 30, 'Completed Company');
        const upcoming = createApplication(2, 'Interview', 30, 'Upcoming Company');
        const invalid = createApplication(3, 'Interview', 30, 'Invalid Company');

        const items = getAttentionItems(
            [completed, upcoming, invalid],
            [
                createInterview(1, 1, '2026-07-17T10:00:00.000Z'),
                createInterview(2, 2, '2026-07-17T10:00:00.000Z'),
                createInterview(3, 2, '2026-07-19T10:00:00.000Z'),
                createInterview(4, 3, 'invalid'),
            ],
            now
        );

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            application: { job_id: 1 },
            category: 'post-interview',
            message: 'Your interview process has ended. Follow up or update the application status.',
        });
    });

    test('prioritises post-interview, offer, stale, then follow-up items', () => {
        const applications = [
            createApplication(1, 'Applied', 10),
            createApplication(2, 'Applied', 30),
            createApplication(3, 'Offer', 8),
            createApplication(4, 'Interview', 12),
        ];
        const interviews = [createInterview(1, 4, '2026-07-17T10:00:00.000Z')];

        expect(getAttentionItems(applications, interviews, now).map((item) => item.category)).toEqual([
            'post-interview',
            'offer-review',
            'stale-application',
            'application-follow-up',
        ]);
    });

    test('sorts older Applied items first and caps the result at six', () => {
        const applications = Array.from({ length: 7 }, (_, index) =>
            createApplication(index + 1, 'Applied', 21 + index)
        );

        expect(getAttentionItems(applications, [], now).map((item) => item.application.job_id)).toEqual([
            7, 6, 5, 4, 3, 2,
        ]);
    });

    test('ignores unsupported statuses, future application dates, and invalid application dates', () => {
        const invalid = { ...createApplication(1, 'Applied', 7), application_date: 'invalid' };
        const future = { ...createApplication(2, 'Applied', 7), application_date: '2026-07-19T12:00:00.000Z' };
        const rejected = createApplication(3, 'Rejected', 30);

        expect(getAttentionItems([invalid, future, rejected], [], now)).toEqual([]);
    });
});
