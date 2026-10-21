import {
  FocusLevel,
  MistakeLevel,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';

export type { FocusLevel, MistakeLevel, WorkoutLog, WorkoutStatus };

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
