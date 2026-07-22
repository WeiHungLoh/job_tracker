import { getWeeklyInterviewCounts } from '../../pages/dashboard/dashboardSelectors';
import type { WeeklyApplicationCount } from '../../pages/application/models';
import type { JobInterview } from '../../pages/interview/models';

const weeks: WeeklyApplicationCount[] = Array.from({ length: 8 }, (_, index) => ({
    start_of_week: new Date(Date.UTC(2026, 4, 18 + index * 7)).toISOString(),
    applications_count: String(index),
}));

const interview = (interviewId: number, interviewDate: string): JobInterview => ({
    interview_id: interviewId,
    job_id: interviewId,
    company_name: `Company ${interviewId}`,
    job_title: `Role ${interviewId}`,
    interview_date: interviewDate,
    interview_duration_minutes: 60,
    interview_location: '',
    interview_type: '',
    interview_notes: '',
});

describe('dashboard selectors', () => {
    test('aligns interview starts to all eight existing half-open weekly buckets', () => {
        const interviews = [
            interview(1, '2026-05-18T00:00:00.000Z'),
            interview(2, '2026-05-24T23:59:59.999Z'),
            interview(3, '2026-05-25T00:00:00.000Z'),
            interview(4, '2026-07-06T12:00:00.000Z'),
        ];

        expect(getWeeklyInterviewCounts(interviews, weeks)).toEqual([2, 1, 0, 0, 0, 0, 0, 1]);
    });

    test('ignores interviews outside the supplied range and invalid dates', () => {
        const interviews = [
            interview(1, '2026-05-17T23:59:59.999Z'),
            interview(2, '2026-07-13T00:00:00.000Z'),
            interview(3, 'not-a-date'),
        ];

        expect(getWeeklyInterviewCounts(interviews, weeks)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });

    test('does not mutate weekly buckets or interview input', () => {
        const interviews = [interview(2, '2026-06-15T10:00:00.000Z'), interview(1, '2026-05-18T10:00:00.000Z')];
        const originalWeeks = structuredClone(weeks);
        const originalInterviews = structuredClone(interviews);

        getWeeklyInterviewCounts(interviews, weeks);

        expect(weeks).toEqual(originalWeeks);
        expect(interviews).toEqual(originalInterviews);
    });
});
