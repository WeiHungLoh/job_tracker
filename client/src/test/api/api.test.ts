import { JobTrackerAPIError } from '../../api/models';
import { makeAuthenticatedJobTrackerAPIRequest, makeJobTrackerAPIRequest } from '../../api/api';

globalThis.fetch = vi.fn();

const response = (data: unknown = undefined, ok = true, status = 200, contentType?: string) => ({
    headers: new Headers(
        data === undefined
            ? undefined
            : { 'content-type': contentType ?? (typeof data === 'object' ? 'application/json' : 'text/plain') }
    ),
    json: async () => data,
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    text: async () => String(data),
    url: 'https://example.com/result',
});

describe('makeJobTrackerAPIRequest', () => {
    beforeEach(() => {
        fetch.mockReset();
        fetch.mockResolvedValue(response());
    });

    test('maps path and query fields while serializing remaining fields as JSON', async () => {
        await makeJobTrackerAPIRequest(
            {
                applicationId: 'id with spaces',
                includeArchived: true,
                notes: 'Updated',
            },
            {
                url: '/applications/:applicationId',
                verb: 'PATCH',
                fieldMap: {
                    applicationId: 'path',
                    includeArchived: 'query',
                },
            }
        );

        expect(fetch).toHaveBeenCalledWith(
            `${import.meta.env.VITE_API_URL}/applications/id%20with%20spaces?includeArchived=true`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: 'Updated' }),
            }
        );
    });

    test('adds each array item as a repeated query parameter', async () => {
        await makeJobTrackerAPIRequest(
            { jobStatuses: ['Accepted', 'Offer'] },
            {
                url: '/job-applications',
                verb: 'GET',
                fieldMap: { jobStatuses: 'query' },
            }
        );

        expect(fetch).toHaveBeenCalledWith(
            `${import.meta.env.VITE_API_URL}/job-applications?jobStatuses=Accepted&jobStatuses=Offer`,
            { method: 'GET' }
        );
    });

    test('preserves an empty query selection', async () => {
        await makeJobTrackerAPIRequest(
            { jobStatuses: [] },
            {
                url: '/job-applications',
                verb: 'GET',
                fieldMap: { jobStatuses: 'query' },
            }
        );

        expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/job-applications?jobStatuses=`, {
            method: 'GET',
        });
    });

    test('creates FormData without adding a JSON content-type header', async () => {
        await makeJobTrackerAPIRequest(
            { fileName: 'resume.pdf' },
            {
                url: '/uploads',
                verb: 'POST',
                fieldMap: { fileName: 'formData' },
            }
        );

        const [, init] = fetch.mock.calls[0];
        expect(init).toMatchObject({ method: 'POST' });
        expect(init.headers).toBeUndefined();
        expect(init.body).toBeInstanceOf(FormData);
        expect((init.body as FormData).get('fileName')).toBe('resume.pdf');
    });

    test('returns parsed response data directly', async () => {
        fetch.mockResolvedValueOnce(response({ applications: 2 }));

        const result = await makeJobTrackerAPIRequest<null, { applications: number }>(null, {
            url: '/applications',
            verb: 'GET',
        });

        expect(result).toEqual({ applications: 2 });
    });

    test('throws the parsed backend error for a non-success response', async () => {
        fetch.mockResolvedValueOnce(response({ message: 'Invalid request' }, false, 400));

        await expect(
            makeJobTrackerAPIRequest<null, { message: string }>(null, {
                url: '/applications',
                verb: 'GET',
            })
        ).rejects.toEqual(
            expect.objectContaining<JobTrackerAPIError>({
                message: 'Invalid request',
                status: 400,
            })
        );
    });

    test('refreshes authentication and retries an authenticated request after a 401 response', async () => {
        fetch
            .mockResolvedValueOnce(response({ message: 'Access token expired.' }, false, 401))
            .mockResolvedValueOnce(response({ message: 'Access token refreshed.' }))
            .mockResolvedValueOnce(response({ applications: 2 }));

        const result = await makeAuthenticatedJobTrackerAPIRequest<null, { applications: number }>(null, {
            url: '/job-applications',
            verb: 'GET',
        });

        expect(result).toEqual({ applications: 2 });
        expect(fetch.mock.calls).toEqual([
            [`${import.meta.env.VITE_API_URL}/job-applications`, { method: 'GET' }],
            [`${import.meta.env.VITE_API_URL}/authentication/sessions/refresh`, { method: 'POST' }],
            [`${import.meta.env.VITE_API_URL}/job-applications`, { method: 'GET' }],
        ]);
    });

    test('does not retry when the refresh endpoint returns 401', async () => {
        fetch
            .mockResolvedValueOnce(response({ message: 'Access token expired.' }, false, 401))
            .mockResolvedValueOnce(response({ message: 'Refresh token expired.' }, false, 401));

        await expect(
            makeAuthenticatedJobTrackerAPIRequest<null, never>(null, {
                url: '/job-applications',
                verb: 'GET',
            })
        ).rejects.toEqual(
            expect.objectContaining<JobTrackerAPIError>({
                message: 'Refresh token expired.',
                status: 401,
            })
        );
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('shares one refresh request between concurrent authenticated requests', async () => {
        let protectedRequestCount = 0;
        let refreshRequestCount = 0;

        fetch.mockImplementation(async (url: string) => {
            if (url.endsWith('/authentication/sessions/refresh')) {
                refreshRequestCount += 1;
                await new Promise((resolve) => setTimeout(resolve, 0));
                return response({ message: 'Access token refreshed.' });
            }

            protectedRequestCount += 1;
            if (protectedRequestCount <= 2) {
                return response({ message: 'Access token expired.' }, false, 401);
            }

            return response({ applications: 2 });
        });

        const requests = [
            makeAuthenticatedJobTrackerAPIRequest<null, { applications: number }>(null, {
                url: '/job-applications',
                verb: 'GET',
            }),
            makeAuthenticatedJobTrackerAPIRequest<null, { applications: number }>(null, {
                url: '/job-applications',
                verb: 'GET',
            }),
        ];

        await expect(Promise.all(requests)).resolves.toEqual([{ applications: 2 }, { applications: 2 }]);
        expect(refreshRequestCount).toBe(1);
        expect(protectedRequestCount).toBe(4);
    });

    test('returns null for a successful no-content response', async () => {
        fetch.mockResolvedValueOnce(response(undefined, true, 204));

        const result = await makeJobTrackerAPIRequest<null, null>(null, {
            url: '/authentication/sessions/current',
            verb: 'DELETE',
        });

        expect(result).toBeNull();
    });

    test('rejects an HTML fallback page returned as a successful API response', async () => {
        fetch.mockResolvedValueOnce(response('<!doctype html><html></html>', true, 200, 'text/html'));

        await expect(
            makeJobTrackerAPIRequest<null, unknown>(null, {
                url: '/applications',
                verb: 'GET',
            })
        ).rejects.toEqual(
            expect.objectContaining<JobTrackerAPIError>({
                message: 'The API returned an unexpected HTML page.',
                status: 502,
            })
        );
    });
});
