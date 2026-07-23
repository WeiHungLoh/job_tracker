import {
    extractJobPostingMetadata,
    type JobPostingMetadataLimits,
} from '../../../pages/application/jobApplication/jobPostingMetadata';

const limits: JobPostingMetadataLimits = {
    companyName: 150,
    jobTitle: 150,
    location: 200,
};

const extract = (values: unknown[], pageURL = 'https://jobs.example.com/roles/engineer') =>
    extractJobPostingMetadata(
        values.map((value) => JSON.stringify(value)),
        pageURL,
        limits
    );

describe('extractJobPostingMetadata', () => {
    test('extracts supported fields from one JobPosting and normalizes whitespace', () => {
        expect(
            extract([
                {
                    '@context': 'https://schema.org',
                    '@type': 'JobPosting',
                    title: '  Senior   Software Engineer ',
                    hiringOrganization: { name: ' Example   Pte Ltd ' },
                    jobLocation: {
                        '@type': 'Place',
                        address: {
                            '@type': 'PostalAddress',
                            addressLocality: ' Singapore ',
                            addressRegion: 'Singapore',
                            addressCountry: { name: ' SG ' },
                        },
                    },
                },
            ])
        ).toEqual({
            companyName: 'Example Pte Ltd',
            jobTitle: 'Senior Software Engineer',
            jobLocation: 'Singapore, SG',
        });
    });

    test('supports JobPosting in an @graph and @type arrays', () => {
        expect(
            extract([
                {
                    '@context': 'https://schema.org',
                    '@graph': [
                        { '@type': 'BreadcrumbList' },
                        {
                            '@type': ['Thing', 'JobPosting'],
                            title: 'Platform Engineer',
                            hiringOrganization: { name: 'Example' },
                            jobLocationType: ['FULL_TIME', ' telecommute '],
                        },
                    ],
                },
            ])
        ).toEqual({
            companyName: 'Example',
            jobTitle: 'Platform Engineer',
            jobLocation: 'Remote',
        });
    });

    test('leaves remote location empty when it exceeds the location limit', () => {
        expect(
            extractJobPostingMetadata(
                [
                    JSON.stringify({
                        '@type': 'JobPosting',
                        jobLocationType: 'TELECOMMUTE',
                    }),
                ],
                'https://jobs.example.com/roles/engineer',
                { ...limits, location: 5 }
            )
        ).toEqual({
            companyName: '',
            jobTitle: '',
            jobLocation: '',
        });
    });

    test('ignores malformed blocks and continues to a valid block', () => {
        expect(
            extractJobPostingMetadata(
                [
                    '{"@type":"JobPosting",',
                    JSON.stringify({
                        '@type': 'JobPosting',
                        title: 'QA Engineer',
                    }),
                ],
                'https://jobs.example.com/roles/qa',
                limits
            )
        ).toEqual({
            companyName: '',
            jobTitle: 'QA Engineer',
            jobLocation: '',
        });
    });

    test('uses the only candidate whose URL matches a multi-job page', () => {
        expect(
            extract([
                [
                    {
                        '@type': 'JobPosting',
                        url: 'https://jobs.example.com/roles/designer',
                        title: 'Designer',
                    },
                    {
                        '@type': 'JobPosting',
                        url: '/roles/engineer?utm_source=board#apply',
                        title: 'Engineer',
                        hiringOrganization: { name: 'Example' },
                    },
                ],
            ])
        ).toEqual({
            companyName: 'Example',
            jobTitle: 'Engineer',
            jobLocation: '',
        });
    });

    test('falls back when multiple candidates are ambiguous', () => {
        expect(
            extract([
                [
                    { '@type': 'JobPosting', title: 'Engineer' },
                    { '@type': 'JobPosting', title: 'Designer' },
                ],
            ])
        ).toEqual({
            companyName: '',
            jobTitle: '',
            jobLocation: '',
        });
    });

    test('leaves multiple physical locations empty', () => {
        expect(
            extract([
                {
                    '@type': 'JobPosting',
                    title: 'Engineer',
                    jobLocation: [
                        { address: { addressLocality: 'Singapore' } },
                        { address: { addressLocality: 'Sydney' } },
                    ],
                },
            ])
        ).toEqual({
            companyName: '',
            jobTitle: 'Engineer',
            jobLocation: '',
        });
    });

    test('ignores missing, unexpected and over-limit field values', () => {
        expect(
            extract([
                {
                    '@type': 'JobPosting',
                    title: 'x'.repeat(limits.jobTitle + 1),
                    hiringOrganization: { name: 'x'.repeat(limits.companyName + 1) },
                    jobLocation: {
                        address: {
                            addressLocality: 'x'.repeat(limits.location + 1),
                        },
                    },
                },
            ])
        ).toEqual({
            companyName: '',
            jobTitle: '',
            jobLocation: '',
        });
    });

    test('returns empty values when no JobPosting exists', () => {
        expect(extract([{ '@type': 'Organization', name: 'Example' }])).toEqual({
            companyName: '',
            jobTitle: '',
            jobLocation: '',
        });
    });
});
