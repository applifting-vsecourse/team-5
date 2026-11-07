import { APP_TIME_ZONE } from './calendar-date';

// Convert a local midnight to UTC without assuming the summer/winter offset.
function dayStart(day: string): Date {
  const utc = new Date(`${day}T00:00:00.000Z`);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utc);
  const part = (name: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === name)?.value);
  const localAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return new Date(utc.getTime() - (localAsUtc - utc.getTime()));
}

export function historyMonthRange(month: string): { gte: Date; lt: Date } {
  const next = new Date(`${month}-01T00:00:00.000Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return {
    gte: dayStart(`${month}-01`),
    lt: dayStart(next.toISOString().slice(0, 10)),
  };
}

export function plannedMinutes(
  training: { steps: { durationMinutes: number }[] } | null,
): number | null {
  return training
    ? training.steps.reduce((sum, step) => sum + step.durationMinutes, 0)
    : null;
}

export type HistoryFilters = {
  dogId?: string;
  month?: string;
  commentsOnly?: boolean;
  page?: number;
  pageSize?: number;
};
