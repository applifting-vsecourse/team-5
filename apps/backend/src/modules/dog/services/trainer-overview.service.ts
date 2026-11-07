import {
  fromCalendarDate,
  todayInAppZone,
} from '@/modules/dog/domain/calendar-date';
import { calculateTrainingMetrics } from '@/modules/dog/domain/training-metrics';
import { TrainerOverviewRepository } from '@/modules/dog/repositories/trainer-overview.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

const INACTIVE_DAYS = 5;
const LOW_SUCCESS_RATE = 65;
const REPLY_WINDOW_MS = 14 * 86400000;

function pointChange(change: number | null): string {
  const rounded = change === null ? 0 : Math.round(change);
  if (rounded === 0) return '';
  return ` (${rounded > 0 ? '+' : '−'}${Math.abs(rounded)} b.)`;
}

@Injectable()
export class TrainerOverviewService {
  constructor(private readonly repository: TrainerOverviewRepository) {}

  async overview(user: Identity, now = new Date()) {
    const connections = await this.repository.inputs(user.id);
    const today = todayInAppZone(now);
    const attention: {
      id: string;
      kind: 'reply' | 'inactive' | 'low-success';
      dog: { id: string; name: string; color: number };
      client: { id: string; name: string };
      label: string;
      activityId: string | null;
      goalId: string | null;
    }[] = [];
    const allLogs = connections
      .flatMap((connection) =>
        connection.client.dogs.flatMap((dog) => dog.workoutLogs),
      )
      .filter((log) => log.completedAt <= now);
    const total = calculateTrainingMetrics(allLogs, 0, now);
    const clients = connections.map((connection) => {
      const client = connection.client;
      const logs = client.dogs
        .flatMap((dog) => dog.workoutLogs)
        .filter((log) => log.completedAt <= now);
      const metrics = calculateTrainingMetrics(logs, 0, now);
      const last = logs
        .filter((log) => log.status === 'COMPLETED')
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())[0];
      for (const dog of client.dogs) {
        const dogLogs = dog.workoutLogs.filter((log) => log.completedAt <= now);
        const dogMetrics = calculateTrainingMetrics(dogLogs, 0, now);
        const completed = dogLogs.find((log) => log.status === 'COMPLETED');
        const activity = dogLogs[0];
        const quietDays = Math.max(
          0,
          Math.round(
            (fromCalendarDate(today).getTime() -
              fromCalendarDate(
                todayInAppZone(completed?.completedAt ?? dog.createdAt),
              ).getTime()) /
              86400000,
          ),
        );
        // Only recent records: an old note nobody answered is no longer news.
        const unanswered = dogLogs.find((log) => {
          if (log.completedAt.getTime() < now.getTime() - REPLY_WINDOW_MS)
            return false;
          const message = log.messages[0];
          return message ? message.authorId === client.id : Boolean(log.note);
        });
        const common = {
          dog: { id: dog.id, name: dog.name, color: dog.color },
          client: { id: client.id, name: client.name },
          activityId: activity?.id ?? null,
          goalId: dog.goals[0]?.id ?? null,
        };
        if (unanswered)
          attention.push({
            ...common,
            id: `reply-${dog.id}`,
            kind: 'reply',
            label: unanswered.messages.length
              ? 'Nová zpráva u tréninku'
              : 'Nová poznámka u tréninku',
            activityId: unanswered.id,
          });
        else if (quietDays >= INACTIVE_DAYS)
          attention.push({
            ...common,
            id: `inactive-${dog.id}`,
            kind: 'inactive',
            label: completed
              ? `Bez tréninku ${quietDays} dní`
              : `Zatím bez tréninku · ${quietDays} dní`,
          });
        else if (
          dogMetrics.successRate !== null &&
          dogMetrics.successRate < LOW_SUCCESS_RATE
        )
          attention.push({
            ...common,
            id: `low-success-${dog.id}`,
            kind: 'low-success',
            label: `Úspěšnost ${Math.round(dogMetrics.successRate)} %${pointChange(dogMetrics.weeklyChange)}`,
          });
      }
      return {
        id: client.id,
        name: client.name,
        dogs: client.dogs.map((dog) => ({
          id: dog.id,
          name: dog.name,
          color: dog.color,
        })),
        successRate: metrics.successRate,
        weeks: metrics.weeks.map((week) => ({
          from: week.from,
          successRate: week.successRate,
        })),
        lastTraining: last
          ? { id: last.id, title: last.title, completedAt: last.completedAt }
          : null,
      };
    });
    const active = connections.filter(
      (connection) => connection.client.dogs.length > 0,
    );
    return {
      metrics: {
        activeClients: active.length,
        newClientsThisMonth: active.filter(
          (connection) =>
            todayInAppZone(connection.createdAt).slice(0, 7) ===
            today.slice(0, 7),
        ).length,
        completedThisWeek: total.weeks[7].completedSessions,
        weeklySessionChange:
          total.weeks[7].completedSessions - total.weeks[6].completedSessions,
        successRate: total.successRate,
        weeklyRateChange: total.weeklyChange,
      },
      clients,
      attention,
    };
  }
}
