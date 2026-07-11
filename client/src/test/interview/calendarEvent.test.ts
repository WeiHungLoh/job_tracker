import {
    buildCalendarEventDetails,
    buildGoogleCalendarUrl,
    buildIcsContent,
    formatGoogleCalendarTimestamp,
    isOverdueInterviewDate,
} from '../../pages/interview/calendarOptions/calendarEvent';

const interview = {
    company_name: 'Acme, Inc.',
    interview_date: '2026-08-15T09:30:00+08:00',
    interview_id: 42,
    interview_location: 'Room 5, HQ; Singapore',
    interview_notes: 'Review C:\\projects\\demo\nBring examples, questions; and notes.',
    interview_type: 'Technical Interview',
    job_title: 'Software Engineer',
};

describe('calendar event helpers', () => {
    test('builds an encoded Google Calendar URL with a one-hour UTC event', () => {
        const calendarUrl = buildGoogleCalendarUrl(buildCalendarEventDetails(interview));
        const url = new URL(calendarUrl);

        expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
        expect(calendarUrl).toContain('text=Acme%2C+Inc.+%E2%80%94+Technical+Interview');
        expect(url.searchParams.get('action')).toBe('TEMPLATE');
        expect(url.searchParams.get('text')).toBe('Acme, Inc. — Technical Interview');
        expect(url.searchParams.get('dates')).toBe('20260815T013000Z/20260815T023000Z');
        expect(url.searchParams.get('location')).toBe('Room 5, HQ; Singapore');
        expect(url.searchParams.get('details')).toBe(
            'Job title: Software Engineer\nInterview type: Technical Interview\n\nNotes:\n' +
                'Review C:\\projects\\demo\nBring examples, questions; and notes.'
        );
    });

    test('builds escaped iCalendar content with CRLF line endings and a stable UID', () => {
        const content = buildIcsContent(buildCalendarEventDetails(interview), new Date('2026-07-04T00:00:00Z'));

        expect(content).toContain('BEGIN:VCALENDAR\r\n');
        expect(content).toContain('BEGIN:VEVENT\r\n');
        expect(content).toContain('UID:42@jobtracker.weihungloh.com\r\n');
        expect(content).toContain('DTSTAMP:20260704T000000Z\r\n');
        expect(content).toContain('DTSTART:20260815T013000Z\r\n');
        expect(content).toContain('DTEND:20260815T023000Z\r\n');
        expect(content).toContain('SUMMARY:Acme\\, Inc. — Technical Interview\r\n');
        expect(content).toContain(
            'DESCRIPTION:Job title: Software Engineer\\nInterview type: Technical Interview\\n\\nNotes:\\n' +
                'Review C:\\\\projects\\\\demo\\nBring examples\\, questions\\; and notes.\r\n'
        );
        expect(content).toContain('LOCATION:Room 5\\, HQ\\; Singapore\r\n');
        expect(content).toContain('END:VEVENT\r\nEND:VCALENDAR\r\n');
        expect(content.replace(/\r\n/g, '')).not.toContain('\n');
    });

    test('formats timestamps without locale-dependent date formatting', () => {
        expect(formatGoogleCalendarTimestamp(new Date('2026-08-15T01:30:45.123Z'))).toBe('20260815T013045Z');
    });

    test('identifies only valid past interview dates as overdue', () => {
        const now = new Date('2026-07-11T00:00:00Z');

        expect(isOverdueInterviewDate('2026-07-10T23:59:59Z', now)).toBe(true);
        expect(isOverdueInterviewDate('2026-07-11T00:00:01Z', now)).toBe(false);
        expect(isOverdueInterviewDate('not-a-date', now)).toBe(false);
    });

    test('uses the fallback title and omits empty optional values', () => {
        const event = buildCalendarEventDetails({
            ...interview,
            interview_location: '',
            interview_notes: '',
            interview_type: '',
        });
        const content = buildIcsContent(event, new Date('2026-07-04T00:00:00Z'));

        expect(event.title).toBe('Acme, Inc. — Job Interview');
        expect(event.description).toBe('Job title: Software Engineer');
        expect(content).toContain('LOCATION:\r\n');
        expect(content).not.toMatch(/undefined|null/);
    });

    test('rejects malformed interview dates', () => {
        expect(() => buildCalendarEventDetails({ ...interview, interview_date: 'not-a-date' })).toThrow(
            'Invalid interview date'
        );
    });
});
