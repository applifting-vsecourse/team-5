import { PlanBlock } from '@/generated/prisma/client';

export type { PlanBlock };

export type CreatePlanBlockData = {
  title: string;
  instruction?: string;
  criterion?: string;
  // Index in the plan to insert at; missing means "at the end" (#65).
  insertAt?: number;
};

export type UpdatePlanBlockData = {
  title?: string;
  instruction?: string;
  criterion?: string;
};
