export const isNonEmptyString = (value: unknown): value is string => (
    typeof value === 'string' && value.trim().length > 0
)

export const isString = (value: unknown): value is string => typeof value === 'string'

export const isPositiveInteger = (value: string): boolean => {
    const parsedValue = Number(value)
    return Number.isInteger(parsedValue) && parsedValue > 0
}

export const isValidDate = (value: unknown): value is string => (
    typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value))
)

export const isValidEmail = (value: unknown): value is string => (
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
)

export const isJobStatus = (value: unknown): value is JobStatus => (
    typeof value === 'string' && jobStatuses.has(value)
)
import type { JobStatus } from '../db/models.js'

const jobStatuses: ReadonlySet<string> = new Set([
    'Accepted',
    'Applied',
    'Declined',
    'Ghosted',
    'Interview',
    'Offer',
    'Rejected'
])

