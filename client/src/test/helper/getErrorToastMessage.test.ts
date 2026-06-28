import { JobTrackerAPIError } from '../../api/models';
import { getErrorToastMessage } from '../../helper/getErrorToastMessage';

describe('getErrorToastMessage', () => {
    test('returns the backend message for an API error', () => {
        const error = new JobTrackerAPIError('Job application not found.', 404);

        expect(getErrorToastMessage(error, 'Unable to load the job application.')).toBe('Job application not found.');
    });

    test('returns the frontend fallback for a non-API error', () => {
        expect(getErrorToastMessage(new TypeError('Failed to fetch'), 'Unable to reach the server.')).toBe(
            'Unable to reach the server.'
        );
    });
});
