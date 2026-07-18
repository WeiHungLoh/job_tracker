import type { JobApplication, JobStatus } from '../../application/models';
import type { JobInterview } from '../../interview/models';
import { getInterviewTiming } from '../../../helper/interviewTiming';

export const FOLLOW_UP_AFTER_DAYS = 7;
export const STALE_AFTER_DAYS = 21;
export const MAX_ATTENTION_ITEMS = 6;
export const ATTENTION_APPLICATION_STATUSES = ['Applied', 'Interview', 'Offer'] as const satisfies readonly JobStatus[];

export type AttentionItemCategory = 'post-interview' | 'offer-review' | 'stale-application' | 'application-follow-up';

export type AttentionItem = {
    application: JobApplication;
    category: AttentionItemCategory;
    message: string;
};

type AttentionCandidate = AttentionItem & {
    priority: number;
    sortValue: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const CATEGORY_PRIORITY: Record<AttentionItemCategory, number> = {
    'post-interview': 0,
    'offer-review': 1,
    'stale-application': 2,
    'application-follow-up': 3,
};

const getApplicationAgeDays = (application: JobApplication, now: Date): number | null => {
    const applicationTime = Date.parse(application.application_date);
    const elapsed = now.getTime() - applicationTime;

    return Number.isFinite(applicationTime) && elapsed >= 0 ? Math.floor(elapsed / DAY_MS) : null;
};

export const getAttentionItems = (
    applications: readonly JobApplication[],
    interviews: readonly JobInterview[],
    now = new Date()
): AttentionItem[] => {
    const interviewsByJobId = new Map<number, JobInterview[]>();

    interviews.forEach((interview) => {
        const linked = interviewsByJobId.get(interview.job_id) ?? [];
        linked.push(interview);
        interviewsByJobId.set(interview.job_id, linked);
    });

    const candidates = applications.flatMap<AttentionCandidate>((application) => {
        const ageDays = getApplicationAgeDays(application, now);
        const linkedInterviews = interviewsByJobId.get(application.job_id) ?? [];

        if (application.job_status === 'Interview' && linkedInterviews.length > 0) {
            const timings = linkedInterviews.map((interview) => getInterviewTiming(interview, now));
            if (timings.every((timing) => timing.isValid && timing.hasEnded)) {
                const latestEnd = Math.max(...timings.map((timing) => timing.end.getTime()));
                const category: AttentionItemCategory = 'post-interview';
                return [
                    {
                        application,
                        category,
                        message: 'Your interview process has ended. Follow up or update the application status.',
                        priority: CATEGORY_PRIORITY[category],
                        sortValue: latestEnd,
                    },
                ];
            }
        }

        if (application.job_status === 'Offer') {
            const category: AttentionItemCategory = 'offer-review';
            return [
                {
                    application,
                    category,
                    message: 'This application is currently at Offer.',
                    priority: CATEGORY_PRIORITY[category],
                    sortValue: ageDays ?? 0,
                },
            ];
        }

        if (application.job_status !== 'Applied' || linkedInterviews.length > 0 || ageDays === null) {
            return [];
        }

        const category: AttentionItemCategory | null =
            ageDays >= STALE_AFTER_DAYS
                ? 'stale-application'
                : ageDays >= FOLLOW_UP_AFTER_DAYS
                ? 'application-follow-up'
                : null;

        if (!category) {
            return [];
        }

        return [
            {
                application,
                category,
                message: `Applied ${ageDays} days ago with no interview scheduled.`,
                priority: CATEGORY_PRIORITY[category],
                sortValue: ageDays,
            },
        ];
    });

    return candidates
        .sort((first, second) => {
            const priorityDifference = first.priority - second.priority;
            if (priorityDifference !== 0) return priorityDifference;

            const valueDifference = second.sortValue - first.sortValue;
            return valueDifference || first.application.job_id - second.application.job_id;
        })
        .slice(0, MAX_ATTENTION_ITEMS)
        .map(({ application, category, message }) => ({ application, category, message }));
};
