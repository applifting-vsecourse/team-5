// A training is planned for a day, not a moment, so the API speaks in plain
// calendar dates ("2026-10-22") and the database stores them as DATE.
// "Today" is the day in the Czech time zone, where the app's users train.
export const APP_TIME_ZONE = 'Europe/Prague';

export const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const todayInAppZone = (now: Date = new Date()): string =>
  // en-CA formats as YYYY-MM-DD.
  new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

// A DATE column comes back from Prisma as midnight UTC of that day.
export const toCalendarDate = (date: Date): string =>
  date.toISOString().slice(0, 10);

export const fromCalendarDate = (calendarDate: string): Date =>
  new Date(`${calendarDate}T00:00:00.000Z`);
