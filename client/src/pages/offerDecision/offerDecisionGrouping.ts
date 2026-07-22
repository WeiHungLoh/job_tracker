import { calculateOfferDecisionScore } from './offerEvaluation';
import type { OfferDecisionApplication, OfferDecisionGroups } from './models';

export const sortEvaluatedOffers = (applications: OfferDecisionApplication[]): OfferDecisionApplication[] =>
    [...applications].sort((first, second) => {
        const firstDeadline = first.evaluation?.details.decision_deadline ?? '';
        const secondDeadline = second.evaluation?.details.decision_deadline ?? '';
        if (!firstDeadline || !secondDeadline) {
            if (firstDeadline !== secondDeadline) {
                return firstDeadline ? -1 : 1;
            }
        }
        if (firstDeadline !== secondDeadline) {
            return firstDeadline.localeCompare(secondDeadline);
        }

        const firstScore = first.evaluation ? calculateOfferDecisionScore(first.evaluation.ratings) : -1;
        const secondScore = second.evaluation ? calculateOfferDecisionScore(second.evaluation.ratings) : -1;
        if (firstScore !== secondScore) {
            return secondScore - firstScore;
        }
        const nameComparison = `${first.company_name} ${first.job_title}`.localeCompare(
            `${second.company_name} ${second.job_title}`
        );
        return nameComparison || first.job_id - second.job_id;
    });

export const sortPreviousOfferEvaluations = (applications: OfferDecisionApplication[]): OfferDecisionApplication[] =>
    [...applications].sort((first, second) => {
        const firstScore = first.evaluation ? calculateOfferDecisionScore(first.evaluation.ratings) : -1;
        const secondScore = second.evaluation ? calculateOfferDecisionScore(second.evaluation.ratings) : -1;
        if (firstScore !== secondScore) {
            return secondScore - firstScore;
        }
        const nameComparison = `${first.company_name} ${first.job_title}`.localeCompare(
            `${second.company_name} ${second.job_title}`
        );
        return nameComparison || first.job_id - second.job_id;
    });

export const isOfferDecisionDeadlineExpired = (deadline: string, now = new Date()): boolean =>
    Boolean(deadline) && new Date(deadline).getTime() < now.getTime();

export const groupOfferDecisionApplications = (
    applications: OfferDecisionApplication[],
    now = new Date()
): OfferDecisionGroups => {
    const currentOffers = applications.filter((application) => application.job_status === 'Offer');
    const currentEvaluations = currentOffers.filter((application) => Boolean(application.evaluation));

    return {
        'Offers to Evaluate': currentOffers.filter((application) => !application.evaluation),
        'Evaluated Offers': sortEvaluatedOffers(
            currentEvaluations.filter(
                (application) =>
                    !isOfferDecisionDeadlineExpired(application.evaluation?.details.decision_deadline ?? '', now)
            )
        ),
        'Expired Evaluated Offers': sortEvaluatedOffers(
            currentEvaluations.filter((application) =>
                isOfferDecisionDeadlineExpired(application.evaluation?.details.decision_deadline ?? '', now)
            )
        ),
        'Previous Evaluations': sortPreviousOfferEvaluations(
            applications.filter((application) => application.job_status !== 'Offer' && application.evaluation)
        ),
    };
};
