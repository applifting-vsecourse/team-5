import { TrainerOverviewRepository } from '@/modules/dog/repositories/trainer-overview.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { mock } from 'jest-mock-extended';
import { TrainerOverviewService } from './trainer-overview.service';

const trainer = { id: 't1' } as Identity;
// Wednesday noon in Prague.
const now = new Date('2026-10-28T11:00:00.000Z');
const daysAgo = (days: number): Date =>
  new Date(now.getTime() - days * 86400000);

type Log = {
  id: string;
  title: string;
  completedAt: Date;
  status: 'COMPLETED' | 'SKIPPED';
  successRate: number | null;
  note: string | null;
  messages: { authorId: string | null }[];
};
const log = (
  id: string,
  days: number,
  rate: number,
  extra: Partial<Log> = {},
): Log => ({
  id,
  title: `Trénink ${id}`,
  completedAt: daysAgo(days),
  status: 'COMPLETED',
  successRate: rate,
  note: null,
  messages: [],
  ...extra,
});
const dog = (id: string, logs: Log[]) => ({
  id,
  name: id,
  color: 1,
  breed: null,
  createdAt: daysAgo(60),
  goals: [{ id: `goal-${id}`, title: 'Přivolání', deadline: null, blocks: [] }],
  workoutLogs: logs,
});

const setup = (connections: unknown[]) => {
  const repository = mock<TrainerOverviewRepository>();
  repository.inputs.mockResolvedValue(connections as never);
  return new TrainerOverviewService(repository);
};

describe('TrainerOverviewService', () => {
  it('flags a reply, a quiet dog and falling success with real reasons', async () => {
    const service = setup([
      {
        createdAt: daysAgo(3),
        client: {
          id: 'c1',
          name: 'Jana',
          dogs: [
            dog('Rex', [log('r1', 1, 80, { messages: [{ authorId: 'c1' }] })]),
            dog('Luna', [log('l1', 6, 90)]),
            dog('Max', [log('m1', 1, 40), log('m2', 8, 70)]),
            dog('Bára', [log('b1', 1, 90)]),
          ],
        },
      },
    ]);

    const result = await service.overview(trainer, now);

    expect(
      result.attention.map((item) => [item.kind, item.dog.name, item.label]),
    ).toEqual([
      ['reply', 'Rex', 'Nová zpráva u tréninku'],
      ['inactive', 'Luna', 'Bez tréninku 6 dní'],
      ['low-success', 'Max', 'Úspěšnost 55 % (−30 b.)'],
    ]);
    expect(result.attention[0].activityId).toBe('r1');
    expect(result.attention[2].goalId).toBe('goal-Max');
  });

  it('does not treat an answered message or an old note as news', async () => {
    const service = setup([
      {
        createdAt: daysAgo(40),
        client: {
          id: 'c1',
          name: 'Jana',
          dogs: [
            dog('Rex', [
              log('r1', 1, 80, { messages: [{ authorId: 't1' }] }),
              log('r2', 20, 80, { note: 'stará poznámka' }),
            ]),
          ],
        },
      },
    ]);

    const result = await service.overview(trainer, now);

    expect(result.attention).toEqual([]);
  });

  it('counts active clients, this week trainings and new clients this month', async () => {
    const service = setup([
      {
        createdAt: daysAgo(3),
        client: {
          id: 'c1',
          name: 'Jana',
          dogs: [
            dog('Rex', [log('r1', 0, 80), log('r2', 1, 60), log('r3', 8, 50)]),
          ],
        },
      },
      { createdAt: daysAgo(40), client: { id: 'c2', name: 'Petr', dogs: [] } },
    ]);

    const result = await service.overview(trainer, now);

    expect(result.metrics).toMatchObject({
      activeClients: 1,
      newClientsThisMonth: 1,
      completedThisWeek: 2,
      weeklySessionChange: 1,
      successRate: 63.3,
      weeklyRateChange: 20,
    });
    expect(result.clients[0].lastTraining?.id).toBe('r1');
    expect(result.clients[0].activity.days.at(-1)).toMatchObject({
      date: '2026-10-28',
      completedSessions: 1,
      successRate: 80,
    });
    expect(result.clients[0].dogs[0]).toMatchObject({
      breed: null,
      successRate: 63.3,
      lastTraining: { id: 'r1', successRate: 80, note: null },
      goals: [
        { id: 'goal-Rex', title: 'Přivolání', totalSteps: 0, masteredSteps: 0 },
      ],
    });
    expect(result.clients[1]).toMatchObject({
      name: 'Petr',
      successRate: null,
      lastTraining: null,
    });
  });
});
