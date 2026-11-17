import {
  FocusLevel,
  MistakeLevel,
  SleepQuality,
  TrainingEnvironment,
  TrainingMessage,
  WorkoutLog,
  WorkoutStatus,
} from '@/generated/prisma/client';
import { Author } from '@/shared/auth/domain/present-author';

export type {
  FocusLevel,
  MistakeLevel,
  SleepQuality,
  TrainingEnvironment,
  WorkoutLog,
  WorkoutStatus,
};

export type ActivityWithMessages = WorkoutLog & {
  messages: (TrainingMessage & { author: Author | null })[];
};

// One page of a dog's records (#79) and how many there are in total.
export type ActivityPage = {
  items: ActivityWithMessages[];
  total: number;
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
  sleepQuality?: SleepQuality;
  environment?: TrainingEnvironment;
  note?: string;
  videoUrl?: string;
  skipReason?: string;
};
