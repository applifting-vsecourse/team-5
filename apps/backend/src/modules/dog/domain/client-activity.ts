import {
  fromCalendarDate,
  toCalendarDate,
  todayInAppZone,
} from './calendar-date';
import { MetricLog } from './training-metrics';

export type ClientActivity = {
  days: {
    date: string;
    completedSessions: number;
    ratedSessions: number;
    successRate: number | null;
  }[];
  successRate: number | null;
};

/** Inclusive fortnight, using Czech calendar days even across DST changes. */
export function clientActivity(logs: MetricLog[], now: Date): ClientActivity {
  const today = fromCalendarDate(todayInAppZone(now)).getTime();
  const days = Array.from({ length: 14 }, (_, index) => ({
    date: toCalendarDate(new Date(today + (index - 13) * 86400000)),
    completedSessions: 0,
    ratedSessions: 0,
    totalRate: 0,
  }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (const log of logs) {
    if (log.status !== 'COMPLETED' || log.completedAt > now) continue;
    const day = byDate.get(todayInAppZone(log.completedAt));
    if (!day) continue;
    day.completedSessions++;
    if (log.successRate !== null) {
      day.ratedSessions++;
      day.totalRate += log.successRate;
    }
  }
  const average = (sum: number, count: number): number | null =>
    count ? Math.round((sum / count) * 10) / 10 : null;
  return {
    days: days.map(({ totalRate, ...day }) => ({
      ...day,
      successRate: average(totalRate, day.ratedSessions),
    })),
    successRate: average(
      days.reduce((sum, day) => sum + day.totalRate, 0),
      days.reduce((sum, day) => sum + day.ratedSessions, 0),
    ),
  };
}
