import type { JobInterview } from '../models';

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/render';
const INTERVIEW_DURATION_MS = 60 * 60 * 1000;
const UID_DOMAIN = 'jobtracker.weihungloh.com';

type CalendarInterview = Pick<
    JobInterview,
    | 'company_name'
    | 'interview_date'
    | 'interview_id'
    | 'interview_location'
    | 'interview_notes'
    | 'interview_type'
    | 'job_title'
>;

export type CalendarEventDetails = {
    description: string;
    end: Date;
    interviewId: number;
    location: string;
    start: Date;
    title: string;
};

const populated = (value: string | null | undefined): string => value?.trim() ?? '';

export const isFutureInterviewDate = (interviewDate: string, now = new Date()): boolean => {
    const date = new Date(interviewDate);
    return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime();
};

export const formatGoogleCalendarTimestamp = (date: Date): string => {
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid calendar date');
    }

    return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z');
};

export const buildCalendarEventDetails = (interview: CalendarInterview): CalendarEventDetails => {
    const start = new Date(interview.interview_date);

    if (Number.isNaN(start.getTime())) {
        throw new Error('Invalid interview date');
    }

    const companyName = populated(interview.company_name);
    const interviewType = populated(interview.interview_type);
    const jobTitle = populated(interview.job_title);
    const notes = populated(interview.interview_notes);
    const descriptionLines: string[] = [];

    if (jobTitle) {
        descriptionLines.push(`Job title: ${jobTitle}`);
    }
    if (interviewType) {
        descriptionLines.push(`Interview type: ${interviewType}`);
    }
    if (notes) {
        if (descriptionLines.length > 0) {
            descriptionLines.push('');
        }
        descriptionLines.push('Notes:', notes);
    }

    return {
        description: descriptionLines.join('\n'),
        end: new Date(start.getTime() + INTERVIEW_DURATION_MS),
        interviewId: interview.interview_id,
        location: populated(interview.interview_location),
        start,
        title: `${companyName} — ${interviewType || 'Job Interview'}`,
    };
};

export const buildGoogleCalendarUrl = (event: CalendarEventDetails): string => {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        dates: `${formatGoogleCalendarTimestamp(event.start)}/${formatGoogleCalendarTimestamp(event.end)}`,
        details: event.description,
        location: event.location,
        text: event.title,
    });

    return `${GOOGLE_CALENDAR_URL}?${params.toString()}`;
};

const escapeIcsText = (value: string): string =>
    value
        .replace(/\\/g, '\\\\')
        .replace(/\r\n|\r|\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');

export const buildIcsContent = (event: CalendarEventDetails, createdAt = new Date()): string => {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Job Tracker//Interview Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${event.interviewId}@${UID_DOMAIN}`,
        `DTSTAMP:${formatGoogleCalendarTimestamp(createdAt)}`,
        `DTSTART:${formatGoogleCalendarTimestamp(event.start)}`,
        `DTEND:${formatGoogleCalendarTimestamp(event.end)}`,
        `SUMMARY:${escapeIcsText(event.title)}`,
        `DESCRIPTION:${escapeIcsText(event.description)}`,
        `LOCATION:${escapeIcsText(event.location)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
    ];

    return `${lines.join('\r\n')}\r\n`;
};

const buildIcsFilename = (event: CalendarEventDetails): string => {
    const safeTitle = event.title
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return `${safeTitle || 'job-interview'}.ics`;
};

export const downloadIcsEvent = (event: CalendarEventDetails): void => {
    const blob = new Blob([buildIcsContent(event)], { type: 'text/calendar;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');

    try {
        downloadLink.href = objectUrl;
        downloadLink.download = buildIcsFilename(event);
        document.body.appendChild(downloadLink);
        downloadLink.click();
    } finally {
        downloadLink.remove();
        URL.revokeObjectURL(objectUrl);
    }
};
