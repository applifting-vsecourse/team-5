import { TrainingMessage } from '@/generated/prisma/client';
import { Author, presentAuthor } from '@/shared/auth/domain/present-author';

// Shared read projection for the training thread; never expose a stale author
// snapshot after account deletion. Thread creation/composition belongs to F-21.
export function presentTrainingMessage(
  message: TrainingMessage & { author: Author | null },
): Omit<TrainingMessage, 'authorId'> & {
  author: ReturnType<typeof presentAuthor>;
} {
  return {
    id: message.id,
    workoutLogId: message.workoutLogId,
    text: message.text,
    createdAt: message.createdAt,
    author: presentAuthor(message.author),
  };
}
