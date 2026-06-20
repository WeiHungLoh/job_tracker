import type { ErrorResponse, ErrorStatus } from './models.js'
import type { Response } from 'express'

type DatabaseError = Error & {
    code?: string
}

const databaseErrorStatuses: Record<string, { message: string; status: ErrorStatus }> = {
    '08000': { status: 503, message: 'The database service is temporarily unavailable.' },
    '08001': { status: 503, message: 'The database service is temporarily unavailable.' },
    '08003': { status: 503, message: 'The database service is temporarily unavailable.' },
    '08004': { status: 503, message: 'The database service is temporarily unavailable.' },
    '08006': { status: 503, message: 'The database service is temporarily unavailable.' },
    '08007': { status: 503, message: 'The database service is temporarily unavailable.' },
    '08P01': { status: 503, message: 'The database service is temporarily unavailable.' },
    '22007': { status: 422, message: 'The request contains an invalid date.' },
    '22P02': { status: 422, message: 'The request contains invalid data.' },
    '23502': { status: 422, message: 'A required value is missing.' },
    '23503': { status: 422, message: 'A related resource does not exist.' },
    '23505': { status: 409, message: 'A resource with the same value already exists.' },
    '23514': { status: 422, message: 'The request contains an unsupported value.' },
    '40001': { status: 409, message: 'The request conflicted with another update. Please try again.' },
    '40P01': { status: 409, message: 'The request conflicted with another update. Please try again.' },
    '53300': { status: 503, message: 'The database service is temporarily unavailable.' },
    '57P01': { status: 503, message: 'The database service is temporarily unavailable.' },
    '57P02': { status: 503, message: 'The database service is temporarily unavailable.' },
    '57P03': { status: 503, message: 'The database service is temporarily unavailable.' },
    'ECONNREFUSED': { status: 503, message: 'The database service is temporarily unavailable.' },
    'ECONNRESET': { status: 503, message: 'The database service is temporarily unavailable.' },
    'EHOSTUNREACH': { status: 503, message: 'The database service is temporarily unavailable.' },
    'ENETUNREACH': { status: 503, message: 'The database service is temporarily unavailable.' },
    'ENOTFOUND': { status: 503, message: 'The database service is temporarily unavailable.' },
    'ETIMEDOUT': { status: 503, message: 'The database service is temporarily unavailable.' }
}

export const sendError = <T>(
    res: Response<T | ErrorResponse>,
    status: ErrorStatus,
    message: string
): void => {
    res.status(status).json({ message })
}

export const handleRouteError = <T>(
    res: Response<T | ErrorResponse>,
    error: unknown,
    fallbackMessage: string
): void => {
    const databaseError = error instanceof Error ? error as DatabaseError : undefined
    const mappedError = databaseError?.code ? databaseErrorStatuses[databaseError.code] : undefined

    console.error(fallbackMessage, error)
    sendError(
        res,
        mappedError?.status ?? 500,
        mappedError?.message ?? fallbackMessage
    )
}
