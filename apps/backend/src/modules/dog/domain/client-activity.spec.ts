import { clientActivity } from './client-activity';
import { MetricLog } from './training-metrics';

const now = new Date('2026-10-28T11:00:00Z');
const log = (
  at: string,
  successRate: number | null,
  status = 'COMPLETED',
): MetricLog => ({ completedAt: new Date(at), successRate, status });

describe('clientActivity', () => {
  it('returns fourteen continuous Czech dates over the autumn DST change', () => {
    const result = clientActivity(
      [
        log('2026-10-14T22:00:00Z', 90), // Midnight on the first day in Prague.
        log('2026-10-14T21:59:59Z', 10), // Outside the window.
        log('2026-10-25T22:30:00Z', 20), // Still October 25 after DST ends.
        log('2026-10-25T23:30:00Z', 80),
      ],
      now,
    );
    expect(result.days.map((day) => day.date)).toEqual(
      Array.from({ length: 14 }, (_, index) => `2026-10-${index + 15}`),
    );
    expect(result.days[0].successRate).toBe(90);
    expect(result.days[10].successRate).toBe(20);
    expect(result.days[11].successRate).toBe(80);
  });

  it('distinguishes no training, unrated training and a true zero rating', () => {
    const result = clientActivity(
      [
        log('2026-10-26T12:00:00Z', null),
        log('2026-10-27T12:00:00Z', 0),
        log('2026-10-28T09:00:00Z', 100, 'SKIPPED'),
        log('2026-10-28T12:00:00Z', 100), // Future, even though today.
      ],
      now,
    );
    expect(result.days.slice(-3)).toEqual([
      {
        date: '2026-10-26',
        completedSessions: 1,
        ratedSessions: 0,
        successRate: null,
      },
      {
        date: '2026-10-27',
        completedSessions: 1,
        ratedSessions: 1,
        successRate: 0,
      },
      {
        date: '2026-10-28',
        completedSessions: 0,
        ratedSessions: 0,
        successRate: null,
      },
    ]);
    expect(result.successRate).toBe(0);
    expect(clientActivity([], now).successRate).toBeNull();
  });

  it('weights the fortnight by rated sessions rather than daily averages', () => {
    const result = clientActivity(
      [
        log('2026-10-27T12:00:00Z', 100),
        log('2026-10-28T09:00:00Z', 0),
        log('2026-10-28T10:00:00Z', 0),
        log('2026-10-28T10:30:00Z', null),
      ],
      now,
    );
    expect(result.successRate).toBe(33.3);
    expect(result.days[13]).toMatchObject({
      completedSessions: 3,
      ratedSessions: 2,
      successRate: 0,
    });
  });
});
