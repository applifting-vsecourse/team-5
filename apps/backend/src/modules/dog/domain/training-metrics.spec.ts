import { calculateTrainingMetrics, MetricLog } from './training-metrics';

const log = (
  date: string,
  successRate: number | null = null,
  status = 'COMPLETED',
): MetricLog => ({ completedAt: new Date(date), successRate, status });

describe('training metrics', () => {
  const now = new Date('2026-11-05T12:00:00Z');

  it('returns zero counts and null averages without data', () => {
    const result = calculateTrainingMetrics([], 3, now);
    expect(result).toMatchObject({
      streak: 0,
      weeklyTrainedDays: 0,
      successRate: null,
      weeklyChange: null,
      ratedSessions: 0,
    });
    expect(result.weeks).toHaveLength(8);
    expect(result.weeks[7]).toMatchObject({
      from: '2026-11-02',
      to: '2026-11-08',
      trainedDays: 0,
    });
  });

  it('counts distinct Prague days, keeps zero scores, ignores skips and future records', () => {
    const result = calculateTrainingMetrics(
      [
        log('2026-11-02T12:00:00Z', 0),
        log('2026-11-02T15:00:00Z', 100),
        log('2026-11-03T23:30:00Z'), // Wednesday in Prague
        log('2026-11-05T09:00:00Z', 70, 'SKIPPED'),
        log('2026-11-06T09:00:00Z', 100),
      ],
      2,
      now,
    );
    expect(result).toMatchObject({
      weeklyTrainedDays: 2,
      weeklyTargetReached: true,
      successRate: 50,
      ratedSessions: 2,
      streak: 1,
    });
    expect(result.weeks[7]).toMatchObject({
      completedSessions: 3,
      trainedDays: 2,
      ratedSessions: 2,
      successRate: 50,
    });
  });

  it('keeps yesterday’s streak until today ends and resets a broken streak', () => {
    const logs = [log('2026-11-03T12:00:00Z'), log('2026-11-04T12:00:00Z')];
    expect(calculateTrainingMetrics(logs, 3, now).streak).toBe(2);
    expect(
      calculateTrainingMetrics(logs, 3, new Date('2026-11-06T12:00:00Z'))
        .streak,
    ).toBe(0);
  });

  it('handles the autumn DST change as calendar days rather than 24-hour intervals', () => {
    const result = calculateTrainingMetrics(
      [
        log('2026-10-24T21:30:00Z'),
        log('2026-10-25T00:30:00Z'),
        log('2026-10-25T01:30:00Z'),
      ],
      3,
      new Date('2026-10-26T10:00:00Z'),
    );
    expect(result.streak).toBe(2);
    expect(result.weeks[6].trainedDays).toBe(2);
  });

  it('uses an inclusive 28-day range and compares scored weeks only', () => {
    const result = calculateTrainingMetrics(
      [
        log('2026-10-08T12:00:00Z', 100), // outside the range
        log('2026-10-09T12:00:00Z', 0),
        log('2026-10-28T12:00:00Z', 40),
        log('2026-11-03T12:00:00Z', 80),
      ],
      3,
      now,
    );
    expect(result.successRate).toBe(40);
    expect(result.weeklyChange).toBe(40);
    expect(
      calculateTrainingMetrics([log('2026-11-03T12:00:00Z', 80)], 3, now)
        .weeklyChange,
    ).toBeNull();
  });
});
