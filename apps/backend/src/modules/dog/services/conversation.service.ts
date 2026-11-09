import { presentTrainingMessage } from '@/modules/dog/domain/training-message';
import { ConversationRepository } from '@/modules/dog/repositories/conversation.repository';
import { DogAccessService } from '@/modules/dog/services/dog-access.service';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ConversationService {
  constructor(
    private readonly repository: ConversationRepository,
    private readonly access: DogAccessService,
  ) {}

  async updates(user: Identity) {
    const rows = await this.repository.updates(user.id);
    return rows.map((row) => ({
      ...presentTrainingMessage(row),
      activity: row.workoutLog,
    }));
  }

  async record(user: Identity, id: string) {
    const row = await this.repository.record(id);
    if (!row) throw new NotFoundException('Training record not found');
    await this.access.getAccessibleDog(user, row.dogId);
    return row;
  }

  async detail(user: Identity, id: string) {
    const row = await this.record(user, id);
    const messages = row.messages.map(presentTrainingMessage);
    // Older records stored the opening message only as a note.
    if (
      row.note?.trim() &&
      !row.messages.some(
        (message) =>
          message.authorId === row.authorId &&
          message.text === row.note?.trim(),
      )
    ) {
      messages.unshift(
        presentTrainingMessage({
          id: `note-${row.id}`,
          workoutLogId: row.id,
          authorId: row.authorId,
          author: row.author,
          text: row.note.trim(),
          createdAt: row.completedAt,
        }),
      );
    }
    return {
      id: row.id,
      dog: row.dog,
      title: row.title,
      completedAt: row.completedAt,
      successRate: row.successRate,
      note: row.note,
      videoUrl: row.videoUrl,
      mistakeDetails: row.mistakeDetails,
      focus: row.focus,
      repeatedMistakes: row.repeatedMistakes,
      status: row.status,
      goal: row.training
        ? {
            title: row.training.title,
            blocks: row.training.steps.map((step) => ({
              id: step.id,
              title: step.title,
              outcome: step.outcome,
              position: step.position,
            })),
          }
        : null,
      messages,
    };
  }

  async reply(user: Identity, id: string, text: string) {
    await this.record(user, id);
    return presentTrainingMessage(
      await this.repository.reply(id, user.id, text.trim()),
    );
  }
}
