import {
  FocusLevel,
  MistakeLevel,
  ScheduledTraining,
  SleepQuality,
  StepOutcome,
  TrainingEnvironment,
  TrainingStatus,
} from '@/generated/prisma/client';

export type {
  FocusLevel,
  MistakeLevel,
  ScheduledTraining,
  SleepQuality,
  TrainingEnvironment,
  TrainingStatus,
};

// A training as the week shows it (#72): which dog, which goal and the plan's
// exercises in order, so a card can list them without more requests.
export type WeekTraining = ScheduledTraining & {
  workoutLog?: { id: string; successRate: number | null } | null;
  training: { id: string; title: string; position?: number; total?: number };
  dog: { id: string; name: string; color: number };
  goal: {
    id: string;
    title: string;
    blocks: { id: string; title: string; durationMinutes?: number }[];
    discipline?: string | null;
  };
};

// Full detail for the walkthrough screen (#76): dog info, goal title, and
// full exercise details (instruction, criterion, position) ordered by position.
export type ScheduledTrainingDetail = ScheduledTraining & {
  training: { id: string; title: string };
  dog: {
    ownerId?: string;
    id: string;
    name: string;
    color: number;
    shares?: { id: string; trainerId: string }[];
  };
  goal: {
    id: string;
    title: string;
    currentStepId: string | null;
    blocks: {
      id: string;
      position: number;
      durationMinutes: number;
      title: string;
      instruction: string | null;
      criterion: string | null;
      outcome: StepOutcome | null;
    }[];
  };
};

export type CompleteTrainingData = {
  mistakeDetails?: string[];
  successRate?: number;
  focus?: FocusLevel;
  repeatedMistakes?: MistakeLevel;
  sleepQuality?: SleepQuality;
  environment?: TrainingEnvironment;
  note?: string;
  videoUrl?: string;
};
