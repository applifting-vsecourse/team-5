import { GoalStatus, TrainingGoal } from '@/generated/prisma/client';

export type { GoalStatus, TrainingGoal };

export type GoalAuthor = {
  id: string;
  name: string;
};

// A goal as the rest of the app sees it: the row plus who created it, because
// the screen shows the author next to the goal (#62).
export type Goal = TrainingGoal & {
  createdBy: GoalAuthor;
};

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
