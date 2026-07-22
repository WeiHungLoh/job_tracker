import { getApplicationUnavailableMessage } from '../../pages/interview/applicationNavigationMessages';

const labels = {
    applicationLabel: 'This job application',
    applicationsPageLabel: 'active applications',
    statusFilterLabel: 'job status filter',
};

describe('getApplicationUnavailableMessage', () => {
    test('reports a missing application when its status is selected', () => {
        expect(getApplicationUnavailableMessage(['Applied'], 'Applied', labels)).toBe(
            'This job application is not available in active applications.'
        );
    });

    test('explains how to include an application excluded by the current filters', () => {
        expect(getApplicationUnavailableMessage(['Accepted'], 'Applied', labels)).toBe(
            'This job application is not included in the current job status filter. Select Show All or Applied.'
        );
    });
});
