import {
  APP_TIME_ZONE,
  fromCalendarDate,
  lastDayOfWeek,
  toCalendarDate,
  todayInAppZone,
} from './calendar-date';

export type MetricLog = {
  completedAt: Date;
  status: string;
  successRate: number | null;
};
export type MetricWeek = {
  from: string;
  to: string;
  completedSessions: number;
  trainedDays: number;
  ratedSessions: number;
  successRate: number | null;
};
export type TrainingMetrics = {
  timeZone: string;
  asOf: string;
  weeklyTarget: number;
  weeklyTrainedDays: number;
  weeklyTargetReached: boolean;
  streak: number;
  successRate: number | null;
  ratedSessions: number;
  weeklyChange: number | null;
  weeks: MetricWeek[];
};
const shiftDay = (day: string, offset: number): string =>
  toCalendarDate(new Date(fromCalendarDate(day).getTime() + offset * 86400000));
const average = (values: number[]): number | null =>
  values.length
    ? Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 10) /
      10
    : null;

// Owner progress sums dog-days: two dogs trained today count twice, repeated
// sessions of one dog today count once. Rate and streak still use real logs.
export function calculateOwnerMetrics(
  inputs: { weeklyTarget: number; workoutLogs: MetricLog[] }[],
  now = new Date(),
): TrainingMetrics {
  const perDog = inputs.map((input) =>
    calculateTrainingMetrics(input.workoutLogs, input.weeklyTarget, now),
  );
  const target = inputs.reduce((sum, input) => sum + input.weeklyTarget, 0);
  const combined = calculateTrainingMetrics(
    inputs.flatMap((input) => input.workoutLogs),
    target,
    now,
  );
  const days = perDog.reduce(
    (sum, metrics) => sum + metrics.weeklyTrainedDays,
    0,
  );
  return {
    ...combined,
    weeklyTrainedDays: days,
    weeklyTargetReached: target > 0 && days >= target,
    weeks: combined.weeks.map((week, index) => ({
      ...week,
      trainedDays: perDog.reduce(
        (sum, metrics) => sum + metrics.weeks[index].trainedDays,
        0,
      ),
    })),
  };
}

export function calculateTrainingMetrics(
  logs: MetricLog[],
  weeklyTarget: number,
  now = new Date(),
): TrainingMetrics {
  const today = todayInAppZone(now);
  const monday = shiftDay(lastDayOfWeek(today), -6);
  const completed = logs
    .filter((log) => log.status === 'COMPLETED' && log.completedAt <= now)
    .map((log) => ({ ...log, day: todayInAppZone(log.completedAt) }));
  const days = new Set(completed.map((log) => log.day));
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  const recent = completed.filter((log) => log.day >= shiftDay(today, -27));
  const rated = (items: typeof completed): number[] =>
    items.flatMap((log) => (log.successRate === null ? [] : [log.successRate]));
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const from = shiftDay(monday, (index - 7) * 7);
    const to = shiftDay(from, 6);
    const items = completed.filter((log) => log.day >= from && log.day <= to);
    const values = rated(items);
    return {
      from,
      to,
      completedSessions: items.length,
      trainedDays: new Set(items.map((log) => log.day)).size,
      ratedSessions: values.length,
      successRate: average(values),
    };
  });
  const current = weeks[7];
  const previous = weeks[6];
  return {
    timeZone: APP_TIME_ZONE,
    asOf: today,
    weeklyTarget,
    weeklyTrainedDays: current.trainedDays,
    weeklyTargetReached: current.trainedDays >= weeklyTarget,
    streak,
    successRate: average(rated(recent)),
    ratedSessions: rated(recent).length,
    weeklyChange:
      current.successRate === null || previous.successRate === null
        ? null
        : Math.round((current.successRate - previous.successRate) * 10) / 10,
    weeks,
  };
}
