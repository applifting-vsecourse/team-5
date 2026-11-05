import {
  Discipline,
  DogDiscipline,
  GoalTraining,
  PlanBlock,
  Prisma,
} from '@/generated/prisma/client';

export type CreateGoalTrainingData = { title: string; insertAt?: number };
export type UpdateGoalTrainingData = { title?: string; isArchived?: boolean };
export type TrainingWithSteps = GoalTraining & { steps: PlanBlock[] };
export type DisciplineMembership = DogDiscipline & { discipline: Discipline };
export type DogPlan = (DisciplineMembership & {
  goals: (Prisma.TrainingGoalGetPayload<object> & {
    sessions: TrainingWithSteps[];
  })[];
})[];
export type EditableGoal = Prisma.TrainingGoalGetPayload<{
  include: { dog: true; disciplineEntity: true };
}>;
