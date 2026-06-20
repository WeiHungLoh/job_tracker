import type { APIRequest, EndpointConfigEntry } from './models'
import { FieldType } from './models'
import { JobTrackerAPIError } from './models'

const apiUrl = import.meta.env.VITE_API_URL

const parseResponse = async <T,>(response: Response): Promise<T> => {
    if (response.status === 204) {
        return null as T
    }

    const contentType = response.headers?.get('content-type')
    if (!contentType) {
        return null as T
    }
    if (contentType.includes('application/json')) {
        return await response.json() as T
    }
    return await response.text() as T
}

export const makeJobTrackerAPIRequest = async <TRequest extends APIRequest, TResponse>(
    request: TRequest,
    config: EndpointConfigEntry,
    credentials?: RequestCredentials,
): Promise<TResponse> => {
    let url = `${apiUrl.replace(/\/$/, '')}/${config.url.replace(/^\//, '')}`
    const body: Record<string, unknown> = {}
    const formData = new FormData()
    const query = new URLSearchParams()
    let hasFormData = false

    Object.entries(request ?? {}).forEach(([field, value]) => {
        const fieldType = config.fieldMap?.[field]

        if (fieldType === FieldType.path) {
            url = url.replace(`:${field}`, encodeURIComponent(String(value)))
        } else if (fieldType === FieldType.query) {
            query.append(field, String(value))
        } else if (fieldType === FieldType.formData) {
            formData.append(field, value instanceof Blob ? value : String(value))
            hasFormData = true
        } else {
            body[field] = value
        }
    })

    const queryString = query.toString()
    if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`
    }

    const hasBody = Object.keys(body).length > 0
    const init: RequestInit = {
        method: config.verb,
    }
    if (credentials) {
        init.credentials = credentials
    }

    if (hasFormData) {
        init.body = formData
    } else if (hasBody) {
        init.headers = { 'Content-Type': 'application/json' }
        init.body = JSON.stringify(body)
    }

    const response = await fetch(url, init)
    const data = await parseResponse<TResponse>(response)
    const contentType = response.headers?.get('content-type') ?? ''

    if (
        response.ok &&
        contentType.includes('text/html') &&
        typeof data === 'string' &&
        /<!doctype html|<html[\s>]/i.test(data)
    ) {
        throw new JobTrackerAPIError('The API returned an unexpected HTML page.', 502)
    }

    if (!response.ok) {
        let message = response.statusText || 'Unknown error'
        if (typeof data === 'string') {
            message = data
        } else if (data && typeof data === 'object') {
            const errorBody = data as { detail?: unknown; message?: unknown }
            if (typeof errorBody.message === 'string') {
                message = errorBody.message
            } else if (typeof errorBody.detail === 'string') {
                message = errorBody.detail
            } else {
                message = JSON.stringify(data)
            }
        }
        throw new JobTrackerAPIError(message, response.status)
    }

    return data
}
