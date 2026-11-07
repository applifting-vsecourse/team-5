import { todayInAppZone } from '@/modules/dog/domain/calendar-date';
import {
  HistoryFilters,
  plannedMinutes,
} from '@/modules/dog/domain/history-period';
import { presentTrainingMessage } from '@/modules/dog/domain/training-message';
import { HistoryRepository } from '@/modules/dog/repositories/history.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HistoryService {
  constructor(
    private readonly repository: HistoryRepository,
    private readonly access: DogAccessService,
  ) {}

  dogs(user: Identity) {
    return this.repository.accessibleDogs(user.id);
  }

  async history(user: Identity, query: HistoryFilters, now = new Date()) {
    if (query.dogId) await this.access.getAccessibleDog(user, query.dogId);
    const month = query.month ?? todayInAppZone(now).slice(0, 7);
    const result = await this.repository.page(user.id, query, month);
    const rates = result.monthRecords.flatMap((row) =>
      row.successRate === null ? [] : [row.successRate],
    );
    const durations = result.monthRecords.flatMap((row) => {
      const duration = plannedMinutes(row.training);
      return duration === null ? [] : [duration];
    });
    return {
      items: result.items.map((row) => ({
        id: row.id,
        dog: row.dog,
        title: row.title,
        status: row.status,
        completedAt: row.completedAt,
        successRate: row.successRate,
        note: row.note,
        videoUrl: row.videoUrl,
        mistakeDetails: row.mistakeDetails,
        plannedDurationMinutes: plannedMinutes(row.training),
        messageCount: row._count.messages,
        lastMessage: row.messages[0]
          ? presentTrainingMessage(row.messages[0])
          : null,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      firstRecordedAt: result.firstRecordedAt,
      summary: {
        month,
        completedSessions: result.monthRecords.length,
        trainedDays: new Set(
          result.monthRecords.map((row) => todayInAppZone(row.completedAt)),
        ).size,
        successRate: rates.length
          ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
          : null,
        plannedDurationMinutes: durations.length
          ? durations.reduce((a, b) => a + b, 0)
          : null,
        knownDurationSessions: durations.length,
      },
    };
  }
}
