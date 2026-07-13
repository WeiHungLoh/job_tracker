import {
    filterAndSortInterviews,
    formatInterviewCountdown,
    getInterviewTiming,
    getUpcomingInterviews,
} from '../../helper/interviewTiming';

const interview = (date: Date, duration = 60) => ({
    interview_date: date.toISOString(),
    interview_duration_minutes: duration,
});

describe('interview timing', () => {
    const now = new Date(2026, 6, 13, 12, 0, 0, 0);

    test('calculates end time and formats a same-day local range', () => {
        const timing = getInterviewTiming(interview(new Date(2026, 6, 13, 11, 30, 0, 0)), now);

        expect(timing.end).toEqual(new Date(2026, 6, 13, 12, 30, 0, 0));
        expect(timing.formattedRange).toBe('13 July 2026 from 11:30 am to 12:30 pm');
        expect(timing.isInProgress).toBe(true);
        expect(timing.hasNotEnded).toBe(true);
        expect(timing.hasEnded).toBe(false);
    });

    test.each([
        [new Date(2026, 6, 13, 23, 30), 60, '13 July 2026 at 11:30 pm to 14 July 2026 at 12:30 am'],
        [new Date(2026, 11, 31, 23, 30), 60, '31 December 2026 at 11:30 pm to 1 January 2027 at 12:30 am'],
    ])('formats ranges across date boundaries', (start, duration, expected) => {
        expect(getInterviewTiming(interview(start, duration), now).formattedRange).toBe(expected);
    });

    test('classifies future, in-progress, and exact-end interviews deterministically', () => {
        const future = getInterviewTiming(interview(new Date(2026, 6, 13, 12, 30)), now);
        const inProgress = getInterviewTiming(interview(new Date(2026, 6, 13, 11, 30)), now);
        const endedNow = getInterviewTiming(interview(new Date(2026, 6, 13, 11, 0)), now);

        expect(future.hasNotEnded).toBe(true);
        expect(future.hasStarted).toBe(false);
        expect(inProgress.hasNotEnded).toBe(true);
        expect(inProgress.isInProgress).toBe(true);
        expect(endedNow.hasEnded).toBe(true);
        expect(endedNow.hasNotEnded).toBe(false);
    });

    test('filters and sorts one collection for Show All, Upcoming, Past, and both selections', () => {
        const ended = { ...interview(new Date(2026, 6, 13, 10, 0)), id: 'ended' };
        const inProgress = { ...interview(new Date(2026, 6, 13, 11, 30)), id: 'in progress' };
        const future = { ...interview(new Date(2026, 6, 13, 13, 0)), id: 'future' };
        const interviews = [future, ended, inProgress];

        expect(filterAndSortInterviews(interviews, [], now).map(({ id }) => id)).toEqual([
            'in progress',
            'future',
            'ended',
        ]);
        expect(filterAndSortInterviews(interviews, ['Upcoming Interviews'], now).map(({ id }) => id)).toEqual([
            'in progress',
            'future',
        ]);
        expect(filterAndSortInterviews(interviews, ['Past Interviews'], now).map(({ id }) => id)).toEqual(['ended']);
        expect(
            filterAndSortInterviews(interviews, ['Upcoming Interviews', 'Past Interviews'], now).map(({ id }) => id)
        ).toEqual(['in progress', 'future', 'ended']);
        expect(getUpcomingInterviews(interviews, now).map(({ id }) => id)).toEqual(['in progress', 'future']);
        expect(interviews.map(({ id }) => id)).toEqual(['future', 'ended', 'in progress']);
    });

    test('formats a deterministic countdown and handles invalid values safely', () => {
        const future = getInterviewTiming(interview(new Date(2026, 6, 14, 14, 30)), now);
        const inProgress = getInterviewTiming(interview(new Date(2026, 6, 13, 11, 30)), now);
        const invalid = getInterviewTiming({ interview_date: 'invalid', interview_duration_minutes: 60 }, now);

        expect(formatInterviewCountdown(future, now)).toBe('1 days 2 hours 30 minutes');
        expect(formatInterviewCountdown(inProgress, now)).toBe('0 days 0 hours 30 minutes');
        expect(invalid.isValid).toBe(false);
        expect(invalid.formattedRange).toBe('Invalid interview date');
    });
});
