import type {
    ArchivedJobApplication,
    CreateApplicationRequest,
    DuplicateApplicationErrorResponse,
    JobApplication,
} from '../../pages/application/models';
import { JobTrackerAPIError } from '../../api/models';
import {
    findPotentialDuplicateApplication,
    isDuplicateApplicationError,
    normalizeDuplicateApplicationText,
} from '../../pages/application/possibleDuplicateApplication';

const request = (overrides: Partial<CreateApplicationRequest> = {}): CreateApplicationRequest => ({
    companyName: 'Morgan Stanley',
    jobTitle: 'Software Engineer',
    appDate: new Date('2026-04-01T10:00:00.000Z'),
    jobStatus: 'Applied',
    jobLocation: 'Singapore',
    jobURL: 'https://jobs.example/software-engineer',
    ...overrides,
});

const activeApplication = (overrides: Partial<JobApplication> = {}): JobApplication => ({
    job_id: 1,
    company_name: 'Morgan Stanley',
    job_title: 'Software Engineer',
    application_date: '2026-03-03T10:30:00.000Z',
    job_status: 'Applied',
    job_location: 'Singapore',
    job_posting_url: 'https://jobs.example/software-engineer',
    notes: '',
    ...overrides,
});

const archivedApplication = (overrides: Partial<ArchivedJobApplication> = {}): ArchivedJobApplication => ({
    archived_job_id: 1,
    company_name: 'Morgan Stanley',
    job_title: 'Software Engineer',
    application_date: '2026-03-03T10:30:00.000Z',
    job_status: 'Rejected',
    job_location: 'Singapore',
    job_posting_url: 'https://jobs.example/software-engineer',
    notes: '',
    ...overrides,
});

const duplicateResponse = (overrides: Partial<DuplicateApplicationErrorResponse> = {}) => ({
    code: 'POSSIBLE_DUPLICATE_APPLICATION' as const,
    message: 'Possible duplicate application found.',
    duplicate: {
        company_name: 'Morgan Stanley',
        job_title: 'Software Engineer',
        application_date: '2026-03-03T10:30:00.000Z',
    },
    ...overrides,
});

describe('possible duplicate application matching', () => {
    test('normalizes case and surrounding or repeated whitespace', () => {
        expect(normalizeDuplicateApplicationText('  Morgan   STANLEY\t Singapore  ')).toBe('morgan stanley singapore');
    });

    test('does not treat empty URLs as a duplicate', () => {
        const result = findPotentialDuplicateApplication(
            request({ companyName: 'New Company', jobTitle: 'New Role', jobURL: '   ' }),
            [activeApplication({ job_posting_url: ' ' })],
            []
        );

        expect(result).toBeUndefined();
    });

    test('matches active company and title after normalizing whitespace and case', () => {
        const application = activeApplication({
            company_name: 'morgan\tstanley',
            job_title: 'SOFTWARE   engineer',
            job_posting_url: '',
        });

        const result = findPotentialDuplicateApplication(
            request({
                companyName: '  MORGAN   Stanley  ',
                jobTitle: ' Software\tEngineer ',
                jobURL: '   ',
            }),
            [application],
            []
        );

        expect(result).toEqual({
            company_name: application.company_name,
            job_title: application.job_title,
            application_date: application.application_date,
        });
    });

    test('matches an archived normalized company and title when URLs differ', () => {
        const application = archivedApplication({
            company_name: 'ACME\tLABS',
            job_title: ' platform  ENGINEER ',
            job_posting_url: 'https://jobs.example/archived-role',
        });

        const result = findPotentialDuplicateApplication(
            request({
                companyName: ' Acme   Labs ',
                jobTitle: 'PLATFORM\tEngineer',
                jobURL: 'https://jobs.example/new-role',
            }),
            [],
            [application]
        );

        expect(result).toEqual({
            company_name: application.company_name,
            job_title: application.job_title,
            application_date: application.application_date,
        });
    });

    test('keeps exact URL comparison case-sensitive when company and title differ', () => {
        const result = findPotentialDuplicateApplication(
            request({
                companyName: 'New Company',
                jobTitle: 'New Role',
                jobURL: 'https://Jobs.example/software-engineer',
            }),
            [
                activeApplication({
                    company_name: 'Different Company',
                    job_title: 'Different Role',
                    job_posting_url: 'https://jobs.example/software-engineer',
                }),
            ],
            []
        );

        expect(result).toBeUndefined();
    });

    test.each([
        ['does not remove seniority from job titles', 'Morgan Stanley', 'Senior Software Engineer'],
        ['requires the same title when company matches', 'Morgan Stanley', 'Data Engineer'],
        ['requires the same company when title matches', 'Goldman Sachs', 'Software Engineer'],
    ])('%s', (_description, companyName, jobTitle) => {
        const result = findPotentialDuplicateApplication(
            request({ jobURL: '' }),
            [activeApplication({ company_name: companyName, job_title: jobTitle, job_posting_url: '' })],
            []
        );

        expect(result).toBeUndefined();
    });

    test('prioritizes an exact non-empty URL match over a company-and-title match', () => {
        const result = findPotentialDuplicateApplication(
            request({ jobURL: '  https://jobs.example/software-engineer  ' }),
            [
                activeApplication({
                    job_id: 2,
                    application_date: '2026-03-30T10:30:00.000Z',
                    job_posting_url: 'https://jobs.example/another-role',
                }),
            ],
            [
                archivedApplication({
                    archived_job_id: 3,
                    company_name: 'Different Company',
                    job_title: 'Different Role',
                    application_date: '2025-01-01T10:30:00.000Z',
                }),
            ]
        );

        expect(result).toEqual({
            company_name: 'Different Company',
            job_title: 'Different Role',
            application_date: '2025-01-01T10:30:00.000Z',
        });
    });

    test('prioritizes an active match over a newer archived match', () => {
        const result = findPotentialDuplicateApplication(
            request(),
            [activeApplication({ job_id: 7, application_date: '2025-01-01T10:30:00.000Z' })],
            [archivedApplication({ archived_job_id: 2, application_date: '2026-03-30T10:30:00.000Z' })]
        );

        expect(result?.application_date).toBe('2025-01-01T10:30:00.000Z');
    });

    test('prioritizes the most recent application date within the same match group', () => {
        const result = findPotentialDuplicateApplication(
            request(),
            [
                activeApplication({ job_id: 1, application_date: '2025-01-01T10:30:00.000Z' }),
                activeApplication({ job_id: 9, application_date: '2026-03-30T10:30:00.000Z' }),
            ],
            []
        );

        expect(result?.application_date).toBe('2026-03-30T10:30:00.000Z');
    });

    test('uses ascending numeric ID as the final tie-breaker', () => {
        const result = findPotentialDuplicateApplication(
            request(),
            [
                activeApplication({ job_id: 10, company_name: 'Higher ID' }),
                activeApplication({ job_id: 2, company_name: 'Lower ID' }),
            ],
            []
        );

        expect(result?.company_name).toBe('Lower ID');
    });

    test('does not mutate active or archived application arrays', () => {
        const applications = [activeApplication({ job_id: 2 }), activeApplication({ job_id: 1 })];
        const archivedApplications = [
            archivedApplication({ archived_job_id: 2 }),
            archivedApplication({ archived_job_id: 1 }),
        ];
        const originalApplications = applications.map((application) => ({ ...application }));
        const originalArchivedApplications = archivedApplications.map((application) => ({ ...application }));

        findPotentialDuplicateApplication(request(), applications, archivedApplications);

        expect(applications).toEqual(originalApplications);
        expect(archivedApplications).toEqual(originalArchivedApplications);
    });
});

describe('possible duplicate application API error guard', () => {
    test('accepts the expected structured 409 API error', () => {
        const error = new JobTrackerAPIError('Possible duplicate application found.', 409, duplicateResponse());

        expect(isDuplicateApplicationError(error)).toBe(true);
    });

    test.each([
        ['a non-API error', new Error('Possible duplicate application found.')],
        [
            'a non-409 API error',
            new JobTrackerAPIError('Possible duplicate application found.', 400, duplicateResponse()),
        ],
        ['a null response body', new JobTrackerAPIError('Possible duplicate application found.', 409, null)],
        [
            'the wrong response code',
            new JobTrackerAPIError('Possible duplicate application found.', 409, {
                ...duplicateResponse(),
                code: 'OTHER_ERROR',
            }),
        ],
        [
            'a non-string response message',
            new JobTrackerAPIError('Possible duplicate application found.', 409, {
                ...duplicateResponse(),
                message: 409,
            }),
        ],
        [
            'a missing duplicate object',
            new JobTrackerAPIError('Possible duplicate application found.', 409, {
                code: 'POSSIBLE_DUPLICATE_APPLICATION',
                message: 'Possible duplicate application found.',
            }),
        ],
        [
            'a non-string company name',
            new JobTrackerAPIError('Possible duplicate application found.', 409, {
                ...duplicateResponse(),
                duplicate: { ...duplicateResponse().duplicate, company_name: null },
            }),
        ],
        [
            'a non-string job title',
            new JobTrackerAPIError('Possible duplicate application found.', 409, {
                ...duplicateResponse(),
                duplicate: { ...duplicateResponse().duplicate, job_title: 12 },
            }),
        ],
        [
            'an empty application date',
            new JobTrackerAPIError('Possible duplicate application found.', 409, {
                ...duplicateResponse(),
                duplicate: { ...duplicateResponse().duplicate, application_date: '   ' },
            }),
        ],
        [
            'an unparseable application date',
            new JobTrackerAPIError('Possible duplicate application found.', 409, {
                ...duplicateResponse(),
                duplicate: { ...duplicateResponse().duplicate, application_date: 'not-a-date' },
            }),
        ],
    ])('rejects %s', (_description, error) => {
        expect(isDuplicateApplicationError(error)).toBe(false);
    });
});
