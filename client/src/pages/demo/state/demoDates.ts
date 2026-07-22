const setLocalTime = (date: Date, hour: number, minute = 0): Date => {
    const nextDate = new Date(date);
    nextDate.setHours(hour, minute, 0, 0);
    return nextDate;
};

export const daysAgo = (now: Date, days: number, hour = 12): Date => {
    const date = setLocalTime(now, hour);
    date.setDate(date.getDate() - days);
    return date;
};

export const daysFromNow = (now: Date, days: number, hour = 10): Date => {
    const date = setLocalTime(now, hour);
    date.setDate(date.getDate() + days);
    return date;
};

export const weeksAgo = (now: Date, weeks: number, hour = 12): Date => daysAgo(now, weeks * 7, hour);

export const toDateString = (date: Date): string => date.toISOString();

export const toDateOnlyString = (date: Date): string => date.toISOString().slice(0, 10);

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDateTimeString = (date: Date): string => {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const startOfLocalWeek = (date: Date): Date => {
    const start = setLocalTime(date, 0);
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    return start;
};
