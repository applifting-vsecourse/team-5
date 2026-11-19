import { PlanBlock } from '@/generated/prisma/client';

export type { PlanBlock };

export type CreatePlanBlockData = {
  title: string;
  instruction?: string;
  durationMinutes?: number;
  criterion?: string;
  // Index among siblings to insert at; missing means "at the end" (#65).
  insertAt?: number;
  // Root step to nest under; sub-steps cannot themselves be split (#67).
  parentId?: string;
};

export type UpdatePlanBlockData = {
  title?: string;
  instruction?: string;
  durationMinutes?: number;
  criterion?: string;
};
