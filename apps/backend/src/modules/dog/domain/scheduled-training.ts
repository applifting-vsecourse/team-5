import { ScheduledTraining, TrainingStatus } from '@/generated/prisma/client';

export type { ScheduledTraining, TrainingStatus };

// A training as the week shows it (#72): which dog, which goal and the plan's
// exercises in order, so a card can list them without more requests.
export type WeekTraining = ScheduledTraining & {
  dog: { id: string; name: string; color: number };
  goal: {
    id: string;
    title: string;
    blocks: { id: string; title: string }[];
  };
};

// Full detail for the walkthrough screen (#76): dog info, goal title, and
// full exercise details (instruction, criterion, position) ordered by position.
export type ScheduledTrainingDetail = ScheduledTraining & {
  dog: {
    id: string;
    name: string;
    color: number;
    shares?: { id: string; trainerId: string }[];
  };
  goal: {
    id: string;
    title: string;
    blocks: {
      id: string;
      position: number;
      title: string;
      instruction: string | null;
      criterion: string | null;
    }[];
  };
};
