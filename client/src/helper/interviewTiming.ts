export const INTERVIEW_DURATION_MINUTES_MIN = 1;
export const INTERVIEW_DURATION_MINUTES_MAX = 1440;
export const DEFAULT_INTERVIEW_DURATION_MINUTES = 60;

export const INTERVIEW_TIME_FILTERS = ['Upcoming Interviews', 'Past Interviews'] as const;
export type InterviewTimeFilter = (typeof INTERVIEW_TIME_FILTERS)[number];

type InterviewTimingSource = {
    interview_date: string;
    interview_duration_minutes: number;
};

export type InterviewTiming = {
    end: Date;
    formattedRange: string;
    hasEnded: boolean;
    hasNotEnded: boolean;
    hasStarted: boolean;
    isInProgress: boolean;
    isValid: boolean;
    start: Date;
};

const invalidDate = () => new Date(Number.NaN);

const formatLocalDate = (date: Date): string =>
    date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const formatLocalTime = (date: Date): string =>
    date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

const isSameLocalDate = (firstDate: Date, secondDate: Date): boolean =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate();

const formatInterviewRange = (start: Date, end: Date): string => {
    if (isSameLocalDate(start, end)) {
        return `${formatLocalDate(start)} from ${formatLocalTime(start)} to ${formatLocalTime(end)}`;
    }

    return `${formatLocalDate(start)} at ${formatLocalTime(start)} to ${formatLocalDate(end)} at ${formatLocalTime(
        end
    )}`;
};

export const getInterviewTiming = (interview: InterviewTimingSource, now = new Date()): InterviewTiming => {
    const start = new Date(interview.interview_date);
    const durationIsValid =
        Number.isInteger(interview.interview_duration_minutes) &&
        interview.interview_duration_minutes >= INTERVIEW_DURATION_MINUTES_MIN &&
        interview.interview_duration_minutes <= INTERVIEW_DURATION_MINUTES_MAX;
    const startTime = start.getTime();

    if (Number.isNaN(startTime) || !durationIsValid) {
        return {
            end: invalidDate(),
            formattedRange: 'Invalid interview date',
            hasEnded: false,
            hasNotEnded: false,
            hasStarted: false,
            isInProgress: false,
            isValid: false,
            start,
        };
    }

    const end = new Date(startTime + interview.interview_duration_minutes * 60 * 1000);
    const nowTime = now.getTime();
    const hasStarted = nowTime >= startTime;
    const hasEnded = nowTime >= end.getTime();

    return {
        end,
        formattedRange: formatInterviewRange(start, end),
        hasEnded,
        hasNotEnded: !hasEnded,
        hasStarted,
        isInProgress: hasStarted && !hasEnded,
        isValid: true,
        start,
    };
};

export const formatInterviewCountdown = (timing: InterviewTiming, now = new Date()): string => {
    if (!timing.isValid || timing.hasEnded) {
        return '';
    }

    const countdownTarget = timing.hasStarted ? timing.end : timing.start;
    const remainingMinutes = Math.max(0, Math.floor((countdownTarget.getTime() - now.getTime()) / (60 * 1000)));
    const days = Math.floor(remainingMinutes / (24 * 60));
    const hours = Math.floor((remainingMinutes % (24 * 60)) / 60);
    const minutes = remainingMinutes % 60;

    return `${days} days ${hours} hours ${minutes} minutes`;
};

export const filterAndSortInterviews = <Interview extends InterviewTimingSource>(
    interviews: readonly Interview[],
    selectedFilters: readonly InterviewTimeFilter[],
    now = new Date()
): Interview[] => {
    const nowTime = now.getTime();
    const sortedInterviews = [...interviews].sort((firstInterview, secondInterview) => {
        const firstTiming = getInterviewTiming(firstInterview, now);
        const secondTiming = getInterviewTiming(secondInterview, now);

        if (firstTiming.hasNotEnded !== secondTiming.hasNotEnded) {
            return firstTiming.hasNotEnded ? -1 : 1;
        }
        if (firstTiming.isValid !== secondTiming.isValid) {
            return firstTiming.isValid ? -1 : 1;
        }

        return firstTiming.start.getTime() - secondTiming.start.getTime();
    });

    if (selectedFilters.length !== 1) {
        return sortedInterviews;
    }

    const [selectedFilter] = selectedFilters;
    return sortedInterviews.filter((interview) => {
        const timing = getInterviewTiming(interview, new Date(nowTime));
        return selectedFilter === 'Upcoming Interviews' ? timing.hasNotEnded : timing.hasEnded;
    });
};

export const getUpcomingInterviews = <Interview extends InterviewTimingSource>(
    interviews: readonly Interview[],
    now = new Date()
): Interview[] => filterAndSortInterviews(interviews, ['Upcoming Interviews'], now);
