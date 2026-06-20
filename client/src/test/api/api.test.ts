import { FieldType, JobTrackerAPIError } from '../../api/models'
import { makeJobTrackerAPIRequest } from '../../api/api'

globalThis.fetch = vi.fn()

const response = (data: unknown = undefined, ok = true, status = 200, contentType?: string) => ({
    headers: new Headers(data === undefined
        ? undefined
        : { 'content-type': contentType ?? (typeof data === 'object' ? 'application/json' : 'text/plain') }),
    json: async () => data,
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    text: async () => String(data),
    url: 'https://example.com/result',
})

describe('makeJobTrackerAPIRequest', () => {
    beforeEach(() => {
        fetch.mockReset()
        fetch.mockResolvedValue(response())
    })

    test('maps path and query fields while serializing remaining fields as JSON', async () => {
        await makeJobTrackerAPIRequest({
            applicationId: 'id with spaces',
            includeArchived: true,
            notes: 'Updated',
        }, {
            url: '/applications/:applicationId',
            verb: 'PUT',
            fieldMap: {
                applicationId: FieldType.path,
                includeArchived: FieldType.query,
            },
        })

        expect(fetch).toHaveBeenCalledWith(`${import.meta.env.VITE_API_URL}/applications/id%20with%20spaces?includeArchived=true`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: 'Updated' }),
        })
    })

    test('creates FormData without adding a JSON content-type header', async () => {
        await makeJobTrackerAPIRequest({ fileName: 'resume.pdf' }, {
            url: '/uploads',
            verb: 'POST',
            fieldMap: { fileName: FieldType.formData },
        })

        const [, init] = fetch.mock.calls[0]
        expect(init).toMatchObject({ method: 'POST' })
        expect(init.headers).toBeUndefined()
        expect(init.body).toBeInstanceOf(FormData)
        expect((init.body as FormData).get('fileName')).toBe('resume.pdf')
    })

    test('returns parsed response data directly', async () => {
        fetch.mockResolvedValueOnce(response({ applications: 2 }))

        const result = await makeJobTrackerAPIRequest<null, { applications: number }>(null, {
            url: '/applications',
            verb: 'GET',
        })

        expect(result).toEqual({ applications: 2 })
    })

    test('throws the parsed backend error for a non-success response', async () => {
        fetch.mockResolvedValueOnce(response({ message: 'Invalid request' }, false, 400))

        await expect(makeJobTrackerAPIRequest<null, { message: string }>(null, {
            url: '/applications',
            verb: 'GET',
        })).rejects.toEqual(expect.objectContaining<JobTrackerAPIError>({
            message: 'Invalid request',
            status: 400,
        }))
    })

    test('preserves a backend service-unavailable status', async () => {
        fetch.mockResolvedValueOnce(response({ message: 'Authentication is temporarily unavailable.' }, false, 503))

        await expect(makeJobTrackerAPIRequest<null, never>(null, {
            url: '/authentication/sessions',
            verb: 'POST',
        })).rejects.toEqual(expect.objectContaining<JobTrackerAPIError>({
            message: 'Authentication is temporarily unavailable.',
            status: 503,
        }))
    })

    test('returns null for a successful no-content response', async () => {
        fetch.mockResolvedValueOnce(response(undefined, true, 204))

        const result = await makeJobTrackerAPIRequest<null, null>(null, {
            url: '/authentication/sessions/current',
            verb: 'DELETE',
        })

        expect(result).toBeNull()
    })

    test('rejects an HTML fallback page returned as a successful API response', async () => {
        fetch.mockResolvedValueOnce(response('<!doctype html><html></html>', true, 200, 'text/html'))

        await expect(makeJobTrackerAPIRequest<null, unknown>(null, {
            url: '/applications',
            verb: 'GET',
        })).rejects.toEqual(expect.objectContaining<JobTrackerAPIError>({
            message: 'The API returned an unexpected HTML page.',
            status: 502,
        }))
    })
})
