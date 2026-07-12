import { getApplicationsInBoardOrder } from '../../pages/application/applicationBoard/applicationBoardUtils';
import type { JobStatus } from '../../pages/application/models';

type BoardApplication = {
    id: number;
    job_status: JobStatus;
};

describe('application board ordering', () => {
    test('flattens selected status columns in fixed order without changing incoming order within a column', () => {
        const applications: BoardApplication[] = [
            { id: 1, job_status: 'Applied' },
            { id: 2, job_status: 'Offer' },
            { id: 3, job_status: 'Accepted' },
            { id: 4, job_status: 'Applied' },
            { id: 5, job_status: 'Offer' },
        ];
        const originalApplications = [...applications];

        const orderedApplications = getApplicationsInBoardOrder(applications, ['Applied', 'Offer']);

        expect(orderedApplications.map((application) => application.id)).toEqual([2, 5, 1, 4]);
        expect(applications).toEqual(originalApplications);
        expect(orderedApplications).not.toBe(applications);
    });
});
