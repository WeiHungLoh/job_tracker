/**
 * Parse a datetime-local input value (YYYY-MM-DDThh:mm) into a local Date.
 */
export const MIN_DATETIME_LOCAL = '0001-01-01T00:00';

export const hasValidDatetimeLocalYear = (value: string): boolean => {
    return Number(value.slice(0, 4)) >= 1;
};

export const parseDatetimeLocal = (value: string): Date => {
    const [year, month, day, hour, minute] = value.split(/[-T:]/);
    const date = new Date(0);
    date.setFullYear(Number(year), Number(month) - 1, Number(day));
    date.setHours(Number(hour), Number(minute), 0, 0);
    return date;
};

const formatDate = (dueDate: string | number) => {
    const date = new Date(dueDate);

    const formattedDate = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const formattedDay = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    // Returns the remaining time in ms
    const dateBeforeInterview = date.getTime() - Date.now();
    const dateSinceApplication = Date.now() - date.getTime();

    const formatDuration = (dateDiff: number, pastDueLabel?: string) => {
        if (pastDueLabel && dateDiff <= 0) {
            return pastDueLabel;
        }

        const seconds = Math.floor(dateDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
        return `${days} days ${remainingHours} hours ${remainingMinutes} minutes`;
    };

    const timeSinceApplication = formatDuration(dateSinceApplication);
    const timeBeforeInterview = formatDuration(dateBeforeInterview, 'Past due');

    return { formattedDay, formattedDate, timeSinceApplication, timeBeforeInterview };
};

export default formatDate;
