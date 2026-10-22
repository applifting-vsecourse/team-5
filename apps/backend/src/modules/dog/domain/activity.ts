import {
  FocusLevel,
  MistakeLevel,
  TrainingMessage,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { Author } from '@/shared/auth/domain/present-author';

export type { FocusLevel, MistakeLevel, WorkoutLog, WorkoutStatus };

export type ActivityWithMessages = WorkoutLog & {
  messages: (TrainingMessage & { author: Author | null })[];
};

export type CreateActivityData = {
  title: string;
  discipline?: string;
  status?: WorkoutStatus;
  completedAt?: string | Date;
  successRate?: number;
  rating?: number;
  focus?: FocusLevel;
  repeatedMistakes?: MistakeLevel;
  note?: string;
  videoUrl?: string;
  skipReason?: string;
};
