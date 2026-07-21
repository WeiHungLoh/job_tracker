import { isApplicationStatusDisabled } from '../../pages/application/applicationStatusRestrictions';
import { JOB_STATUSES } from '../../pages/application/models';

describe('application status restrictions', () => {
    test('keeps the existing interview restriction for Applied', () => {
        expect(isApplicationStatusDisabled('Applied', true, false)).toBe(true);
        expect(isApplicationStatusDisabled('Applied', false, false)).toBe(false);
    });

    test('allows only Offer, Accepted and Declined while an offer evaluation exists', () => {
        expect(JOB_STATUSES.filter((status) => !isApplicationStatusDisabled(status, false, true))).toEqual([
            'Accepted',
            'Declined',
            'Offer',
        ]);
    });

    test('restores normal options after the offer evaluation is deleted', () => {
        expect(JOB_STATUSES.every((status) => !isApplicationStatusDisabled(status, false, false))).toBe(true);
    });
});
