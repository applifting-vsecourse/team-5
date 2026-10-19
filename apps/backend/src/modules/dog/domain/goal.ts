import { GoalStatus, TrainingGoal } from '@/generated/prisma/client';

export type { GoalStatus, TrainingGoal };

export type CreateGoalData = {
  title: string;
  discipline?: string;
  principle?: string;
  status?: GoalStatus;
  order?: number;
};

export type UpdateGoalData = {
  title?: string;
  discipline?: string;
  principle?: string;
  status?: GoalStatus;
  order?: number;
};
