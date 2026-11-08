import { calculateOwnerMetrics } from './training-metrics';

const now = new Date('2026-11-07T12:00:00Z');
const log = (rate: number | null, day = '2026-11-07') => ({
  completedAt: new Date(`${day}T10:00:00Z`),
  status: 'COMPLETED',
  successRate: rate,
});

describe('owner metrics', () => {
  it('sums dog-day goals, counts repeated sessions once per dog and weights rates by records', () => {
    const result = calculateOwnerMetrics(
      [
        { weeklyTarget: 3, workoutLogs: [log(100), log(100)] },
        { weeklyTarget: 5, workoutLogs: [log(0)] },
      ],
      now,
    );
    expect(result.weeklyTarget).toBe(8);
    expect(result.weeklyTrainedDays).toBe(2);
    expect(result.weeks[7].completedSessions).toBe(3);
    expect(result.successRate).toBe(66.7);
    expect(result.streak).toBe(1);
  });
  it('continues an owner streak across different dogs without fabricating a rate', () => {
    const result = calculateOwnerMetrics(
      [
        { weeklyTarget: 1, workoutLogs: [log(null)] },
        { weeklyTarget: 1, workoutLogs: [log(null, '2026-11-06')] },
      ],
      now,
    );
    expect(result.streak).toBe(2);
    expect(result.weeklyTargetReached).toBe(true);
    expect(result.successRate).toBeNull();
  });
  it('does not claim a completed target when the owner has no dogs', () => {
    const result = calculateOwnerMetrics([], now);
    expect(result.weeklyTargetReached).toBe(false);
    expect(result.weeklyTarget).toBe(0);
    expect(result.successRate).toBeNull();
  });
});
