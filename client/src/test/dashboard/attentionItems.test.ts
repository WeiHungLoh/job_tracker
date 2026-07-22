import type { JobApplication, JobStatus } from '../../pages/application/models';
import type { JobInterview } from '../../pages/interview/models';
import {
    ATTENTION_APPLICATION_STATUSES,
    FOLLOW_UP_AFTER_DAYS,
    MAX_ATTENTION_ITEMS,
    getAttentionItems,
} from '../../pages/dashboard/attentionCenter/attentionItems';

const now = new Date('2026-07-18T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

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

const createInterviewEndingDaysAgo = (
    interviewId: number,
    jobId: number,
    ageDays: number,
    duration = 60,
    endOffsetMinutes = 0
): JobInterview => {
    const endTime = now.getTime() - ageDays * DAY_MS + endOffsetMinutes * MINUTE_MS;
    return createInterview(interviewId, jobId, new Date(endTime - duration * MINUTE_MS).toISOString(), duration);
};

describe('getAttentionItems', () => {
    test('uses only the three active statuses needed by the dashboard request', () => {
        expect(ATTENTION_APPLICATION_STATUSES).toEqual(['Applied', 'Interview', 'Offer']);
        expect(FOLLOW_UP_AFTER_DAYS).toBe(7);
        expect(MAX_ATTENTION_ITEMS).toBe(6);
    });

    test('includes Applied applications at seven full days without a separate stale category', () => {
        const items = getAttentionItems(
            [
                createApplication(1, 'Applied', 6),
                createApplication(2, 'Applied', 7),
                createApplication(3, 'Applied', 21),
                createApplication(4, 'Applied', 30),
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
                category: 'application-follow-up',
                message: 'Applied 30 days ago with no interview scheduled.',
            },
            {
                jobId: 3,
                category: 'application-follow-up',
                message: 'Applied 21 days ago with no interview scheduled.',
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
        const interview = createInterviewEndingDaysAgo(1, 1, 20);

        expect(getAttentionItems([application], [interview], now)).toEqual([]);
    });

    test('includes completed interview follow-ups at exactly seven full days but not six days', () => {
        const items = getAttentionItems(
            [createApplication(1, 'Interview', 30), createApplication(2, 'Interview', 30)],
            [createInterviewEndingDaysAgo(1, 1, 6), createInterviewEndingDaysAgo(2, 2, 7)],
            now
        );

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            application: { job_id: 2 },
            category: 'post-interview',
            message: 'Your interview process ended 7 days ago. Follow up or update the application status.',
        });
    });

    test('counts from interview end time including duration instead of the start time', () => {
        const startedOverSevenDaysAgo = createInterviewEndingDaysAgo(1, 1, 7, 240, 60);
        const endedExactlySevenDaysAgo = createInterviewEndingDaysAgo(2, 2, 7, 120);

        const items = getAttentionItems(
            [createApplication(1, 'Interview', 30), createApplication(2, 'Interview', 30)],
            [startedOverSevenDaysAgo, endedExactlySevenDaysAgo],
            now
        );

        expect(items.map((item) => item.application.job_id)).toEqual([2]);
        expect(items[0].message).toContain('ended 7 days ago');
    });

    test('uses the latest end time across every linked interview', () => {
        const items = getAttentionItems(
            [createApplication(1, 'Interview', 30), createApplication(2, 'Interview', 30)],
            [
                createInterviewEndingDaysAgo(1, 1, 14),
                createInterviewEndingDaysAgo(2, 1, 7),
                createInterviewEndingDaysAgo(3, 2, 14),
                createInterviewEndingDaysAgo(4, 2, 6),
            ],
            now
        );

        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({ application: { job_id: 1 } });
        expect(items[0].message).toContain('ended 7 days ago');
    });

    test('excludes an application when any linked interview is future or ongoing', () => {
        const items = getAttentionItems(
            [createApplication(1, 'Interview', 30), createApplication(2, 'Interview', 30)],
            [
                createInterviewEndingDaysAgo(1, 1, 14),
                createInterview(2, 1, '2026-07-19T12:00:00.000Z'),
                createInterviewEndingDaysAgo(3, 2, 14),
                createInterview(4, 2, '2026-07-18T11:30:00.000Z'),
            ],
            now
        );

        expect(items).toEqual([]);
    });

    test('does not treat invalid interview dates or durations as completed', () => {
        const applications = Array.from({ length: 4 }, (_, index) => createApplication(index + 1, 'Interview', 30));
        const interviews = [
            createInterview(1, 1, 'invalid'),
            createInterviewEndingDaysAgo(2, 2, 14, 0),
            createInterviewEndingDaysAgo(3, 3, 14, 1.5),
            createInterviewEndingDaysAgo(4, 4, 14, 1441),
        ];

        expect(getAttentionItems(applications, interviews, now)).toEqual([]);
    });

    test('ranks longer completed-interview waits first and reports full elapsed days', () => {
        const items = getAttentionItems(
            [createApplication(1, 'Interview', 30), createApplication(2, 'Interview', 30)],
            [createInterviewEndingDaysAgo(1, 1, 7), createInterviewEndingDaysAgo(2, 2, 14)],
            now
        );

        expect(items.map((item) => item.application.job_id)).toEqual([2, 1]);
        expect(items.map((item) => item.message)).toEqual([
            'Your interview process ended 14 days ago. Follow up or update the application status.',
            'Your interview process ended 7 days ago. Follow up or update the application status.',
        ]);
    });

    test('includes Interview applications with no linked interview and orders valid older dates first', () => {
        const invalidDate = { ...createApplication(1, 'Interview', 10), application_date: 'invalid' };
        const items = getAttentionItems(
            [invalidDate, createApplication(2, 'Interview', 20), createApplication(3, 'Interview', 10)],
            [],
            now
        );

        expect(items.map((item) => item.application.job_id)).toEqual([2, 3, 1]);
        expect(items.every((item) => item.category === 'interview-unscheduled')).toBe(true);
        expect(items[0].message).toBe(
            'This application is at Interview, but no interview has been scheduled. Add an interview to keep it updated.'
        );
    });

    test('does not classify an Interview application as unscheduled when any interview is linked', () => {
        const application = createApplication(1, 'Interview', 30);
        const recentInterview = createInterviewEndingDaysAgo(1, 1, 6);

        expect(getAttentionItems([application], [recentInterview], now)).toEqual([]);
    });

    test('uses the complete category priority order', () => {
        const applications = [
            createApplication(1, 'Applied', 30),
            createApplication(2, 'Offer', 30),
            createApplication(3, 'Interview', 30),
            createApplication(4, 'Interview', 30),
        ];
        const interviews = [createInterviewEndingDaysAgo(1, 4, 7)];

        expect(getAttentionItems(applications, interviews, now).map((item) => item.category)).toEqual([
            'post-interview',
            'interview-unscheduled',
            'offer-review',
            'application-follow-up',
        ]);
    });

    test('uses job_id as the stable tie-breaker for equal primary sorting values', () => {
        const applications = [
            createApplication(4, 'Interview', 30),
            createApplication(2, 'Interview', 30),
            createApplication(8, 'Interview', 20),
            createApplication(6, 'Interview', 20),
            createApplication(12, 'Offer', 10),
            createApplication(10, 'Offer', 10),
        ];
        const interviews = [createInterviewEndingDaysAgo(1, 4, 7), createInterviewEndingDaysAgo(2, 2, 7)];

        expect(getAttentionItems(applications, interviews, now).map((item) => item.application.job_id)).toEqual([
            2, 4, 6, 8, 10, 12,
        ]);
        expect(
            getAttentionItems(
                [createApplication(14, 'Applied', 10), createApplication(13, 'Applied', 10)],
                [],
                now
            ).map((item) => item.application.job_id)
        ).toEqual([13, 14]);
    });

    test('caps the result at six', () => {
        const applications = Array.from({ length: 7 }, (_, index) =>
            createApplication(index + 1, 'Applied', 21 + index)
        );

        expect(getAttentionItems(applications, [], now).map((item) => item.application.job_id)).toEqual([
            7, 6, 5, 4, 3, 2,
        ]);
    });

    test('ignores unsupported statuses, future application dates, and invalid application dates for follow-ups', () => {
        const invalid = { ...createApplication(1, 'Applied', 7), application_date: 'invalid' };
        const future = { ...createApplication(2, 'Applied', 7), application_date: '2026-07-19T12:00:00.000Z' };
        const rejected = createApplication(3, 'Rejected', 30);

        expect(getAttentionItems([invalid, future, rejected], [], now)).toEqual([]);
    });
});
